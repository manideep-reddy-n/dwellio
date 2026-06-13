package com.dwellio.organization.repository;

import com.dwellio.domain.entity.SubscriptionPlan;
import com.dwellio.domain.enums.SubscriptionPlanCode;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SubscriptionPlanRepository extends JpaRepository<SubscriptionPlan, UUID> {

    Optional<SubscriptionPlan> findByCode(SubscriptionPlanCode code);
}
