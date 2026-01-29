#pragma once
#include "Enums.h"

class Receipt {
    int id;
    int ticketId;
    long exitTime;
    double totalFee;
    PaymentStatus status;

public:
    Receipt(int id, int ticketId, long exitTime, double totalFee, PaymentStatus status)
        : id(id),
          ticketId(ticketId),
          exitTime(exitTime),
          totalFee(totalFee),
          status(status) {}

    int getId() const {
        return id;
    }

    int getTicketId() const {
        return ticketId;
    }

    long getExitTime() const {
        return exitTime;
    }

    double getTotalFee() const {
        return totalFee;
    }

    PaymentStatus getStatus() const {
        return status;
    }
};
