package com.dwellio.push.service;

import com.dwellio.auth.repository.UserRepository;
import com.dwellio.common.exception.NotFoundException;
import com.dwellio.common.security.AuthorizationService;
import com.dwellio.domain.entity.PushSubscription;
import com.dwellio.domain.entity.User;
import com.dwellio.push.dto.PushSubscriptionResponse;
import com.dwellio.push.dto.RegisterPushSubscriptionRequest;
import com.dwellio.push.repository.PushSubscriptionRepository;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PushSubscriptionService {

    private final PushSubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;
    private final AuthorizationService authorizationService;
    private final Clock clock;

    @Transactional(readOnly = true)
    public List<PushSubscriptionResponse> listMine() {
        UUID userId = authorizationService.currentPrincipal().getId();
        return subscriptionRepository.findAllActiveByUserId(userId).stream()
                .map(s -> new PushSubscriptionResponse(s.getId(), s.getEndpoint()))
                .toList();
    }

    @Transactional
    public PushSubscriptionResponse register(RegisterPushSubscriptionRequest request) {
        UUID userId = authorizationService.currentPrincipal().getId();
        User user = userRepository.findActiveById(userId).orElseThrow(() -> new NotFoundException("User not found"));

        PushSubscription subscription = subscriptionRepository
                .findActiveByUserIdAndEndpoint(userId, request.endpoint())
                .orElseGet(() -> {
                    PushSubscription created = new PushSubscription();
                    created.setId(UUID.randomUUID());
                    created.setUser(user);
                    return created;
                });

        subscription.setEndpoint(request.endpoint());
        subscription.setP256dh(request.p256dh());
        subscription.setAuthKey(request.auth());
        subscription.setUserAgent(request.userAgent());
        subscription.setDeletedAt(null);
        subscription.setLastUsedAt(Instant.now(clock));

        return new PushSubscriptionResponse(
                subscriptionRepository.save(subscription).getId(),
                subscription.getEndpoint()
        );
    }

    @Transactional
    public void unregister(String endpoint) {
        UUID userId = authorizationService.currentPrincipal().getId();
        subscriptionRepository.findActiveByUserIdAndEndpoint(userId, endpoint).ifPresent(subscription -> {
            subscription.setDeletedAt(Instant.now(clock));
            subscriptionRepository.save(subscription);
        });
    }

    @Transactional(readOnly = true)
    public List<PushSubscription> findActiveForUser(UUID userId) {
        return subscriptionRepository.findAllActiveByUserId(userId);
    }
}
