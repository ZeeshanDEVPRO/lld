#pragma once
#include "../domain/Ticket.h"
#include <cmath>

class PricingService {
    double ratePerHour;

public:
    explicit PricingService(double ratePerHour)
        : ratePerHour(ratePerHour) {}

    double calculate(const Ticket& ticket, long exitTime) const {
        long durationSeconds = exitTime - ticket.getEntryTime();
        double hours = std::ceil(durationSeconds / 3600.0);
        return hours * ratePerHour;
    }
};
