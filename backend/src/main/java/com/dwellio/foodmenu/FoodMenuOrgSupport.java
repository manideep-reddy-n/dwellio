package com.dwellio.foodmenu;

import com.dwellio.common.exception.BadRequestException;
import com.dwellio.domain.entity.Organization;
import com.dwellio.domain.enums.OrganizationType;

public final class FoodMenuOrgSupport {

    private FoodMenuOrgSupport() {
    }

    public static boolean supportsFoodMenu(OrganizationType type) {
        return type == OrganizationType.HOSTEL
                || type == OrganizationType.PG
                || type == OrganizationType.CO_LIVING;
    }

    public static Organization requireFoodMenuOrg(Organization organization) {
        if (!supportsFoodMenu(organization.getType())) {
            throw new BadRequestException("Food menu and meal feedback are available for hostels, PGs, and co-living spaces only");
        }
        return organization;
    }
}
