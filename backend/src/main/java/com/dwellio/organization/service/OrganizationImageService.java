package com.dwellio.organization.service;

import com.dwellio.accommodation.service.AccommodationGuard;
import com.dwellio.common.exception.BadRequestException;
import com.dwellio.common.exception.NotFoundException;
import com.dwellio.common.security.AuthorizationService;
import com.dwellio.common.storage.MediaStorageService;
import com.dwellio.domain.entity.Organization;
import com.dwellio.domain.entity.OrganizationImage;
import com.dwellio.organization.dto.OrganizationImageResponse;
import com.dwellio.organization.repository.OrganizationImageRepository;
import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class OrganizationImageService {

    private static final Set<String> ALLOWED = Set.of("image/jpeg", "image/jpg", "image/png", "image/webp");

    private final OrganizationImageRepository imageRepository;
    private final AccommodationGuard accommodationGuard;
    private final AuthorizationService authorizationService;
    private final MediaStorageService mediaStorage;
    private final java.time.Clock clock;

    @Transactional(readOnly = true)
    public List<OrganizationImageResponse> list(UUID organizationId) {
        accommodationGuard.requireOrganization(organizationId);
        return imageRepository.findAllActiveByOrganizationId(organizationId).stream()
                .map(OrganizationImageService::toResponse)
                .toList();
    }

    @Transactional
    public OrganizationImageResponse upload(UUID organizationId, MultipartFile file, String caption) throws IOException {
        authorizationService.requirePermission(organizationId, "organization:update");
        Organization organization = accommodationGuard.requireOrganization(organizationId);
        validateImage(file);

        String ext = extension(file.getContentType());
        String filename = UUID.randomUUID() + "." + ext;
        MediaStorageService.StoredMedia stored = mediaStorage.storeImage(file, "org-images", filename);

        int sortOrder = imageRepository.findAllActiveByOrganizationId(organizationId).size();
        OrganizationImage image = new OrganizationImage();
        image.setId(UUID.randomUUID());
        image.setOrganization(organization);
        image.setUrl(stored.url());
        image.setPublicId(stored.publicId());
        image.setCaption(caption);
        image.setSortOrder(sortOrder);
        return toResponse(imageRepository.save(image));
    }

    @Transactional
    public void delete(UUID organizationId, UUID imageId) {
        authorizationService.requirePermission(organizationId, "organization:update");
        OrganizationImage image = imageRepository.findById(imageId)
                .filter(i -> i.getDeletedAt() == null && i.getOrganization().getId().equals(organizationId))
                .orElseThrow(() -> new NotFoundException("Image not found"));
        image.setDeletedAt(Instant.now(clock));
        imageRepository.save(image);
    }

    private static void validateImage(MultipartFile file) {
        if (file.isEmpty() || file.getSize() > 5 * 1024 * 1024) {
            throw new BadRequestException("Image must be under 5MB");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED.contains(contentType.toLowerCase())) {
            throw new BadRequestException("Image must be JPG, PNG, or WEBP");
        }
    }

    private static String extension(String contentType) {
        if (contentType == null) return "jpg";
        return switch (contentType.toLowerCase()) {
            case "image/png" -> "png";
            case "image/webp" -> "webp";
            default -> "jpg";
        };
    }

    private static OrganizationImageResponse toResponse(OrganizationImage image) {
        return new OrganizationImageResponse(image.getId(), image.getUrl(), image.getCaption(), image.getSortOrder());
    }
}
