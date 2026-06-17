package com.dwellio.metrics.projection;

import static org.assertj.core.api.Assertions.assertThat;

import com.dwellio.domain.entity.Organization;
import com.dwellio.domain.entity.OrganizationMetricsCache;
import com.dwellio.domain.enums.AccommodationMode;
import com.dwellio.domain.enums.OrganizationStatus;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class CompositeScoreProjectionTest {

    @Test
    void computesSatisfactionAndSearchRankFromMetrics() {
        Organization organization = new Organization();
        organization.setStatus(OrganizationStatus.VERIFIED);

        OrganizationMetricsCache cache = new OrganizationMetricsCache();
        cache.setAccommodationMode(AccommodationMode.BED_BASED);
        cache.setAvgRating(BigDecimal.valueOf(4));
        cache.setResolutionRate(BigDecimal.valueOf(80));
        cache.setAvgFirstResponseHours(BigDecimal.valueOf(12));
        cache.setReviewCount(10);

        BigDecimal satisfaction = CompositeScoreProjection.computeSatisfactionScore(cache, organization);
        BigDecimal searchRank = CompositeScoreProjection.computeSearchRankScore(cache, satisfaction);

        assertThat(satisfaction).isEqualByComparingTo("77.00");
        assertThat(searchRank).isEqualByComparingTo("78.0000");
    }
}
