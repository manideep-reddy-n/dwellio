package com.dwellio.notification.security;

import com.dwellio.auth.repository.UserRepository;
import com.dwellio.auth.security.JwtService;
import com.dwellio.membership.repository.MembershipRepository;
import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class StompJwtChannelInterceptor implements ChannelInterceptor {

    private static final Pattern ORG_TOPIC_PATTERN =
            Pattern.compile("^/topic/org/([0-9a-fA-F-]{36})/announcements$");

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final MembershipRepository membershipRepository;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) {
            return message;
        }

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            authenticateConnect(accessor);
        } else if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
            authorizeSubscribe(accessor);
        }

        return message;
    }

    private void authenticateConnect(StompHeaderAccessor accessor) {
        if (accessor.getUser() != null) {
            return;
        }

        String token = resolveToken(accessor);
        if (token == null || !jwtService.isTokenValid(token)) {
            throw new IllegalArgumentException("Invalid or missing JWT for WebSocket CONNECT");
        }

        UUID userId = jwtService.extractUserId(token);
        userRepository.findActiveById(userId).ifPresentOrElse(user -> {
            accessor.setUser(new StompPrincipal(userId));
        }, () -> {
            throw new IllegalArgumentException("User not found for WebSocket CONNECT");
        });
    }

    private void authorizeSubscribe(StompHeaderAccessor accessor) {
        Principal user = accessor.getUser();
        if (user == null) {
            throw new IllegalArgumentException("Unauthenticated WebSocket subscription");
        }

        String destination = accessor.getDestination();
        if (destination == null) {
            return;
        }

        Matcher matcher = ORG_TOPIC_PATTERN.matcher(destination);
        if (!matcher.matches()) {
            return;
        }

        UUID organizationId = UUID.fromString(matcher.group(1));
        UUID userId = UUID.fromString(user.getName());
        boolean member = membershipRepository.existsActiveByUserIdAndOrganizationId(userId, organizationId);
        if (!member) {
            throw new IllegalArgumentException("Not authorized to subscribe to organization topic");
        }
    }

    private String resolveToken(StompHeaderAccessor accessor) {
        List<String> authorization = accessor.getNativeHeader("Authorization");
        if (authorization != null && !authorization.isEmpty()) {
            String header = authorization.getFirst();
            if (header != null && header.startsWith("Bearer ")) {
                return header.substring(7);
            }
        }

        Map<String, Object> sessionAttributes = accessor.getSessionAttributes();
        if (sessionAttributes != null) {
            Object token = sessionAttributes.get(JwtHandshakeInterceptor.ATTR_ACCESS_TOKEN);
            if (token instanceof String tokenValue) {
                return tokenValue;
            }
        }
        return null;
    }
}
