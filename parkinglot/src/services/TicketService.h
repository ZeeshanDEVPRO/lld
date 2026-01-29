#pragma once
#include "../domain/Ticket.h"
#include "../domain/Vehicle.h"
#include <atomic>  // for atomic integer=> 2 parking tickets for same slot is avoided

class TicketService {
    std::atomic<int> nextId{1};

public:
    Ticket generate(const Vehicle& vehicle, int slotId, long entryTime) {
        int id = nextId++;
        return Ticket(id, vehicle.getId(), slotId, entryTime);
    }
};


