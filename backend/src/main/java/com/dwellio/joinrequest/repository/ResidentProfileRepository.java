package com.dwellio.joinrequest.repository;

import com.dwellio.domain.entity.ResidentProfile;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ResidentProfileRepository extends JpaRepository<ResidentProfile, UUID> {
}
