#pragma once
#include "../domain/ParkingSlot.h"
#include "../domain/Enums.h"
#include <vector>

class SlotService {
    std::vector<ParkingSlot> slots;

public:
    // For now, we inject all slots at construction
    SlotService(const std::vector<ParkingSlot>& initialSlots): slots(initialSlots) {}

    // Allocate first free compatible slot
    ParkingSlot* allocate(VehicleType type) {
        for (auto& slot : slots) {
            if (!slot.isOccupied() && isCompatible(slot, type)) {
                slot.occupy();
                return &slot;
            }
        }
        return nullptr; // no slot available
    }

    void release(int slotId) {
        for (auto& slot : slots) {
            if (slot.getId() == slotId) {
                slot.release();
                return;
            }
        }
    }

private:
    bool isCompatible(const ParkingSlot& slot, VehicleType type) {
        if (type == VehicleType::BIKE) return true;
        if (type == VehicleType::CAR)  return slot.getType() != SlotType::SMALL;
        if (type == VehicleType::TRUCK) return slot.getType() == SlotType::LARGE;
        return false;
    }
};
