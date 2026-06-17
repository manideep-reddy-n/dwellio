package com.dwellio.billing.cycle;

import com.dwellio.domain.entity.BillingRule;
import com.dwellio.domain.entity.Occupancy;
import com.dwellio.domain.entity.Organization;
import com.dwellio.domain.enums.BillingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import org.springframework.stereotype.Component;

@Component
public class BillingCycleCalculator {

    public LocalDate billingMonthAnchor(YearMonth month) {
        return month.atDay(1);
    }

    public LocalDate dueDate(
            Organization organization,
            BillingRule rule,
            YearMonth month,
            Occupancy occupancy
    ) {
        return switch (organization.getBillingMode()) {
            case CALENDAR_MONTH -> calendarDueDate(rule, month);
            case OCCUPANCY_ANCHOR -> occupancyAnchorDueDate(occupancy, month);
            case CUSTOM_DAY -> customDueDate(organization, month);
        };
    }

    private LocalDate calendarDueDate(BillingRule rule, YearMonth month) {
        int day = rule.getDueDayOfMonth() != null
                ? rule.getDueDayOfMonth()
                : 1;
        day = Math.min(day, month.lengthOfMonth());
        return month.atDay(day);
    }

    private LocalDate occupancyAnchorDueDate(Occupancy occupancy, YearMonth month) {
        if (occupancy == null || occupancy.getMoveInDate() == null) {
            return month.atDay(1);
        }
        LocalDate moveIn = occupancy.getMoveInDate();
        int dueDay = Math.min(moveIn.getDayOfMonth(), month.lengthOfMonth());
        LocalDate dueDate = month.atDay(dueDay);
        if (dueDate.isBefore(moveIn)) {
            return moveIn;
        }
        return dueDate;
    }

    private LocalDate customDueDate(Organization organization, YearMonth month) {
        int day = organization.getBillingCustomDay() != null
                ? organization.getBillingCustomDay()
                : 1;
        day = Math.min(day, month.lengthOfMonth());
        return month.atDay(day);
    }
}
