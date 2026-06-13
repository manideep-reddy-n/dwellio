package com.dwellio.metrics.dto;

import com.dwellio.domain.enums.ComplaintCategory;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

public record ComplaintCategoryCount(
        ComplaintCategory category,
        int count
) {
    public static List<ComplaintCategoryCount> fromDistribution(Map<String, Integer> countsByCategory) {
        if (countsByCategory == null || countsByCategory.isEmpty()) {
            return emptyDistribution();
        }

        List<ComplaintCategoryCount> distribution = new ArrayList<>();
        for (ComplaintCategory category : ComplaintCategory.values()) {
            int count = countsByCategory.getOrDefault(category.name(), 0);
            distribution.add(new ComplaintCategoryCount(category, count));
        }
        distribution.sort(Comparator.comparingInt(ComplaintCategoryCount::count).reversed()
                .thenComparing(count -> count.category().name()));
        return distribution;
    }

    private static List<ComplaintCategoryCount> emptyDistribution() {
        List<ComplaintCategoryCount> distribution = new ArrayList<>();
        for (ComplaintCategory category : ComplaintCategory.values()) {
            distribution.add(new ComplaintCategoryCount(category, 0));
        }
        return distribution;
    }
}
