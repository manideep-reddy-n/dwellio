package com.dwellio.metrics.projection;

import com.dwellio.domain.entity.Organization;
import com.dwellio.domain.entity.OrganizationMetricsCache;
import com.dwellio.domain.enums.OrganizationStatus;
import java.math.BigDecimal;
import java.math.RoundingMode;

public final class CompositeScoreProjection {

    private static final BigDecimal MAX_VERIFICATION = BigDecimal.valueOf(20);
    private static final BigDecimal MAX_RATING = BigDecimal.valueOf(25);
    private static final BigDecimal MAX_RESOLUTION = BigDecimal.valueOf(25);
    private static final BigDecimal MAX_RESPONSE_TIME = BigDecimal.valueOf(20);
    private static final BigDecimal MAX_REVIEW_VOLUME = BigDecimal.valueOf(10);

    private CompositeScoreProjection() {
    }

    public static BigDecimal computeSatisfactionScore(OrganizationMetricsCache cache, Organization organization) {
        BigDecimal verification = organization.getStatus() == OrganizationStatus.VERIFIED
                ? MAX_VERIFICATION
                : BigDecimal.ZERO;

        BigDecimal rating = BigDecimal.ZERO;
        if (cache.getAvgRating() != null) {
            BigDecimal normalized = cache.getAvgRating().max(BigDecimal.ZERO).min(BigDecimal.valueOf(5));
            rating = normalized.divide(BigDecimal.valueOf(5), 6, RoundingMode.HALF_UP).multiply(MAX_RATING);
        }

        BigDecimal resolution = BigDecimal.ZERO;
        if (cache.getResolutionRate() != null) {
            BigDecimal normalized = cache.getResolutionRate().max(BigDecimal.ZERO).min(BigDecimal.valueOf(100));
            resolution = normalized.divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP).multiply(MAX_RESOLUTION);
        }

        BigDecimal responseTime = BigDecimal.ZERO;
        if (cache.getAvgFirstResponseHours() != null) {
            double hours = Math.max(0, cache.getAvgFirstResponseHours().doubleValue());
            double normalized = Math.min(1, Math.max(0, 1 - hours / 48));
            responseTime = BigDecimal.valueOf(normalized).multiply(MAX_RESPONSE_TIME);
        }

        BigDecimal reviewVolume = BigDecimal.ZERO;
        if (cache.getReviewCount() > 0) {
            double normalized = Math.min(cache.getReviewCount(), 50) / 50.0;
            reviewVolume = BigDecimal.valueOf(normalized).multiply(MAX_REVIEW_VOLUME);
        }

        BigDecimal score = verification
                .add(rating)
                .add(resolution)
                .add(responseTime)
                .add(reviewVolume);
        return score.setScale(2, RoundingMode.HALF_UP);
    }

    public static BigDecimal computeSearchRankScore(OrganizationMetricsCache cache, BigDecimal satisfactionScore) {
        if (satisfactionScore == null) {
            return null;
        }
        BigDecimal reviewBoost = BigDecimal.ZERO;
        if (cache.getReviewCount() > 0) {
            double normalized = Math.min(cache.getReviewCount(), 50) / 50.0;
            reviewBoost = BigDecimal.valueOf(normalized * 5);
        }
        return satisfactionScore.add(reviewBoost).setScale(4, RoundingMode.HALF_UP);
    }
}
