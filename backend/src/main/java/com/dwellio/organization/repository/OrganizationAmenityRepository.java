package com.dwellio.organization.repository;

import com.dwellio.domain.entity.Amenity;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrganizationAmenityRepository extends JpaRepository<com.dwellio.domain.entity.OrganizationAmenity, com.dwellio.domain.entity.OrganizationAmenity.OrganizationAmenityId> {

    @Query("""
            SELECT oa.amenity FROM OrganizationAmenity oa
            WHERE oa.organizationId = :organizationId
            ORDER BY oa.amenity.name
            """)
    List<Amenity> findAmenitiesByOrganizationId(@Param("organizationId") UUID organizationId);
}
