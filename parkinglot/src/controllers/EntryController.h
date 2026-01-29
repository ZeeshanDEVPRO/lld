#pragma once
#include "../services/SlotService.h"
#include "../services/TicketService.h"
#include "../domain/Vehicle.h"
#include "../domain/Ticket.h"
#include <ctime>

class EntryController {
    SlotService& slotService;
    TicketService& ticketService;

public:
    EntryController(SlotService& ss, TicketService& ts) : slotService(ss), ticketService(ts) {}

    // returns nullptr if no slot available
    Ticket* enter(const Vehicle& vehicle) {
        ParkingSlot* slot = slotService.allocate(vehicle.getType());
        if (!slot) {
            return nullptr;
        }

        long now = std::time(nullptr);
        Ticket ticket = ticketService.generate(vehicle, slot->getId(), now);

        // store ticket in heap for demo simplicity
        return new Ticket(ticket);
    }
};
