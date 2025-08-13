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
    // Check if the name is a URL
    if (name && (name.startsWith('http://') || name.startsWith('https://'))) {
        return <img src={name} alt="" {...props} />;
    }

    // Otherwise, assume it is a Lucide icon name
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
        Handshake,
        // ... add other icons as needed
    };

    const IconComponent = LucideIcons[name];

    // Return the specific icon component if it exists, otherwise default to 'Activity'
    return IconComponent ? <IconComponent {...props} /> : <Activity {...props} />;
};

export default Icon;