package com.dwellio.notification.service;

import com.dwellio.auth.repository.UserRepository;
import com.dwellio.domain.entity.Notification;
import com.dwellio.domain.entity.NotificationDeliveryLog;
import com.dwellio.domain.entity.User;
import com.dwellio.domain.enums.NotificationDeliveryChannel;
import com.dwellio.domain.enums.NotificationDeliveryStatus;
import com.dwellio.notification.repository.NotificationDeliveryLogRepository;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationDeliveryLogService {

    private final NotificationDeliveryLogRepository deliveryLogRepository;
    private final UserRepository userRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(
            Notification notification,
            User user,
            NotificationDeliveryChannel channel,
            NotificationDeliveryStatus status,
            String errorMessage
    ) {
        NotificationDeliveryLog entry = new NotificationDeliveryLog();
        entry.setId(UUID.randomUUID());
        entry.setNotification(notification);
        entry.setUser(userRepository.getReferenceById(user.getId()));
        entry.setChannel(channel);
        entry.setStatus(status);
        entry.setErrorMessage(errorMessage);
        deliveryLogRepository.save(entry);
    }
}
