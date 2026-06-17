package com.dwellio.complaint.sla;

import com.dwellio.domain.entity.Organization;
import java.math.BigDecimal;

public record ComplaintSlaSettings(BigDecimal firstResponseHours, BigDecimal resolutionHours) {

    public static final BigDecimal DEFAULT_FIRST_RESPONSE_HOURS = BigDecimal.valueOf(24);
    public static final BigDecimal DEFAULT_RESOLUTION_HOURS = BigDecimal.valueOf(72);

    public static ComplaintSlaSettings from(Organization organization) {
        BigDecimal firstResponse = organization.getSlaFirstResponseHours() != null
                ? organization.getSlaFirstResponseHours()
                : DEFAULT_FIRST_RESPONSE_HOURS;
        BigDecimal resolution = organization.getSlaResolutionHours() != null
                ? organization.getSlaResolutionHours()
                : DEFAULT_RESOLUTION_HOURS;
        return new ComplaintSlaSettings(firstResponse, resolution);
    }
}
