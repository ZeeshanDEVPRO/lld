import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://professionalid2003:asdf@cluster0.yqbzlis.mongodb.net/flytbase?retryWrites=true&w=majority';

const droneSchema = new mongoose.Schema({
    name: String,
    serial_number: { type: String, unique: true },
    model: String,
    status: { type: String, enum: ['idle', 'in-mission', 'offline', 'maintenance'], default: 'idle' },
    battery_level: { type: Number, default: 100 },
    health_status: { type: String, enum: ['healthy', 'warning', 'critical'], default: 'healthy' },
    location: String
}, { timestamps: true });

const Drone = mongoose.models.Drone || mongoose.model('Drone', droneSchema);

const drones = [
    { name: 'Interceptor-9', serial_number: 'INT-9001', model: 'Phantom X', status: 'idle', battery_level: 85, health_status: 'healthy', location: 'Bravo-Grid-7' },
    { name: 'Surveillance-4', serial_number: 'SUR-4002', model: 'Mavic Air Pro', status: 'offline', battery_level: 42, health_status: 'warning', location: 'Sector-4-Dock' },
    { name: 'Heavy-Lift-1', serial_number: 'HL-0012', model: 'Matrice 300', status: 'maintenance', battery_level: 12, health_status: 'critical', location: 'Base-Repair-A' },
    { name: 'Ghost-Scan-7', serial_number: 'GS-7777', model: 'Autel Evo II', status: 'idle', battery_level: 100, health_status: 'healthy', location: 'North-Watchtower' },
    { name: 'Alpha-One', serial_number: 'ALP-0001', model: 'DJI Inspire 2', status: 'idle', battery_level: 90, health_status: 'healthy', location: 'Main-Hangar' },
    { name: 'Beta-Two', serial_number: 'BET-0002', model: 'DJI Inspire 2', status: 'offline', battery_level: 15, health_status: 'warning', location: 'Sector-B' },
    { name: 'Gamma-Three', serial_number: 'GAM-0003', model: 'Skydio X2', status: 'maintenance', battery_level: 50, health_status: 'critical', location: 'Service-Bay-2' }
];

const seed = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('🌱 Connected to MongoDB...');

        for (const d of drones) {
            const exists = await Drone.findOne({ serial_number: d.serial_number });
            if (!exists) {
                await Drone.create(d);
                console.log(`✅ Created: ${d.name}`);
            } else {
                // Update existing ones to ensure we can test recharge/repair
                await Drone.findOneAndUpdate({ serial_number: d.serial_number }, d);
                console.log(`🔄 Updated: ${d.name}`);
            }
        }
        console.log('🚀 Fleet expansion completed!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error Seeding:', err);
        process.exit(1);
    }
};

seed();
