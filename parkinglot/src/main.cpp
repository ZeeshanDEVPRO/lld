#include <iostream>
#include "domain/Vehicle.h"
#include "domain/ParkingSlot.h"
#include "services/SlotService.h"
#include "services/TicketService.h"
#include "services/PricingService.h"
#include "controllers/EntryController.h"
#include "controllers/ExitController.h"

int main() {
    std::vector<ParkingSlot> slots = {
        ParkingSlot(1, SlotType::SMALL, 1),
        ParkingSlot(2, SlotType::MEDIUM, 1),
        ParkingSlot(3, SlotType::LARGE, 1)
    };

    SlotService slotService(slots);
    TicketService ticketService;
    PricingService pricingService(50.0); // ₹50/hour

    EntryController entry(slotService, ticketService);
    ExitController exitCtrl(slotService, pricingService);

    Vehicle car(101, "DL01AB1234", VehicleType::CAR);

    Ticket* t = entry.enter(car);

    if (!t) {
        std::cout << "No slot available\n";
        return 0;
    }

    std::cout << "Ticket ID: " << t->getId() << "\n";

    // simulate exit
    Receipt r = exitCtrl.exit(*t);

    std::cout << "Receipt ID: " << r.getId()
              << " | Fee: " << r.getTotalFee() << "\n";

    return 0;
}
