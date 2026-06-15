package com.dwellio.membership.service;

import com.dwellio.common.exception.BadRequestException;
import com.dwellio.common.exception.NotFoundException;
import com.dwellio.domain.entity.Membership;
import com.dwellio.domain.entity.ResidentProfile;
import com.dwellio.domain.enums.ResidentStatus;
import com.dwellio.joinrequest.repository.ResidentProfileRepository;
import com.dwellio.membership.dto.ResidentProfileResponse;
import com.dwellio.membership.dto.UpdateResidentProfileRequest;
import com.dwellio.membership.repository.MembershipRepository;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ResidentProfileService {

    private final ResidentProfileRepository residentProfileRepository;
    private final MembershipRepository membershipRepository;

    @Transactional(readOnly = true)
    public ResidentProfileResponse getProfile(UUID userId, String organizationSlug) {
        ResidentProfile profile = requireProfile(userId, organizationSlug);
        return toResponse(profile);
    }

    @Transactional
    public ResidentProfileResponse updateProfile(
            UUID userId,
            String organizationSlug,
            UpdateResidentProfileRequest request
    ) {
        ResidentProfile profile = requireProfile(userId, organizationSlug);
        profile.setEmergencyContactName(trimOrNull(request.emergencyContactName()));
        profile.setEmergencyContactPhone(trimOrNull(request.emergencyContactPhone()));
        return toResponse(residentProfileRepository.save(profile));
    }

    private ResidentProfile requireProfile(UUID userId, String organizationSlug) {
        return residentProfileRepository.findActiveByUserIdAndOrganizationSlug(userId, organizationSlug)
                .orElseGet(() -> createProfileForResident(userId, organizationSlug));
    }

    private ResidentProfile createProfileForResident(UUID userId, String organizationSlug) {
        Membership membership = membershipRepository.findActiveByUserIdAndOrganizationSlug(userId, organizationSlug)
                .orElseThrow(() -> new NotFoundException("Active membership not found"));

        if (membership.getRole().isOwnerRole()
                || !"RESIDENT".equalsIgnoreCase(membership.getRole().getName())) {
            throw new BadRequestException("Resident profile is only available for residents");
        }

        ResidentProfile profile = new ResidentProfile();
        profile.setId(UUID.randomUUID());
        profile.setMembership(membership);
        profile.setStatus(ResidentStatus.ACTIVE);
        return residentProfileRepository.save(profile);
    }

    private static ResidentProfileResponse toResponse(ResidentProfile profile) {
        Membership membership = profile.getMembership();
        return new ResidentProfileResponse(
                membership.getOrganization().getSlug(),
                membership.getOrganization().getName(),
                membership.getId().toString(),
                profile.getEmergencyContactName(),
                profile.getEmergencyContactPhone()
        );
    }

    private static String trimOrNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
