#pragma once
#include "../services/PricingService.h"
#include "../services/SlotService.h"
#include "../domain/Ticket.h"
#include "../domain/Receipt.h"
#include <ctime>
#include <atomic>

class ExitController {
    SlotService& slotService;
    PricingService& pricingService;
    std::atomic<int> nextReceiptId{1};

public:
    ExitController(SlotService& ss, PricingService& ps) : slotService(ss), pricingService(ps) {}

    Receipt exit(Ticket& ticket) {
        long now = std::time(nullptr);

        double fee = pricingService.calculate(ticket, now);

        ticket.close();
        slotService.release(ticket.getSlotId());

        int rid = nextReceiptId++;
        return Receipt(rid, ticket.getId(), now, fee, PaymentStatus::SUCCESS);
    }
};
