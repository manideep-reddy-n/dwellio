package com.dwellio.platform.repository;

import com.dwellio.domain.entity.PlatformSetting;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlatformSettingRepository extends JpaRepository<PlatformSetting, UUID> {

    Optional<PlatformSetting> findBySettingKey(String settingKey);

    List<PlatformSetting> findAllByCategoryOrderBySettingKey(String category);

    List<PlatformSetting> findAllByOrderByCategoryAscSettingKeyAsc();
}
