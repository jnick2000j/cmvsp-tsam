// src/components/Icon.js
import React from 'react';
import { 
    ShieldCheck, 
    ClipboardList, 
    Wrench, 
    GraduationCap, 
    BookOpen,
    UserPlus, 
    Check, 
    FileSignature, 
    Layers, 
    Activity, 
    Handshake 
} from 'lucide-react';

const Icon = ({ name, ...props }) => {
    const LucideIcons = {
        ShieldCheck,
        ClipboardList,
        Wrench,
        GraduationCap,
        BookOpen,
        UserPlus,
        Check,
        FileSignature,
        Layers,
        Activity,
        Handshake
    };

    const IconComponent = LucideIcons[name];

    // Return the specific icon component if it exists, otherwise default to 'Activity'
    return IconComponent ? <IconComponent {...props} /> : <Activity {...props} />;
};

export default Icon;
