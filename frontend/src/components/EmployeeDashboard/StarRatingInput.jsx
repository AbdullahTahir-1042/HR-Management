import React, { useRef, useState } from 'react';
import { Star } from 'lucide-react';

const StarRatingInput = ({ value, onChange, readonly = false, size = 24 }) => {
    const [hoverValue, setHoverValue] = useState(null);
    const containerRef = useRef(null);

    const handleMouseMove = (e, index) => {
        if (readonly) return;
        const rect = e.currentTarget.getBoundingClientRect();
        // Calculate where the mouse is relative to the star element (left half vs right half)
        const isLeftHalf = e.clientX - rect.left < rect.width / 2;
        const newValue = index + (isLeftHalf ? 0.5 : 1);
        setHoverValue(newValue);
    };

    const handleMouseLeave = () => {
        if (readonly) return;
        setHoverValue(null);
    };

    const handleClick = (e, index) => {
        if (readonly) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const isLeftHalf = e.clientX - rect.left < rect.width / 2;
        const newValue = index + (isLeftHalf ? 0.5 : 1);
        onChange(newValue);
    };

    const displayValue = hoverValue !== null ? hoverValue : value;

    return (
        <div 
            className="flex items-center gap-1"
            ref={containerRef}
            onMouseLeave={handleMouseLeave}
        >
            {[0, 1, 2, 3, 4].map(index => {
                const fillPercentage = Math.max(0, Math.min(100, (displayValue - index) * 100));
                
                return (
                    <div
                        key={index}
                        className={`relative ${readonly ? 'cursor-default' : 'cursor-pointer'} group`}
                        onMouseMove={(e) => handleMouseMove(e, index)}
                        onClick={(e) => handleClick(e, index)}
                        style={{ width: size, height: size }}
                    >
                        {/* Background (Empty) Star */}
                        <Star 
                            size={size} 
                            className="absolute top-0 left-0 text-slate-200 transition-colors" 
                        />
                        
                        {/* Foreground (Filled) Star - Masked for partial fill */}
                        <div 
                            className="absolute top-0 left-0 overflow-hidden h-full"
                            style={{ width: `${fillPercentage}%` }}
                        >
                            <Star 
                                size={size} 
                                className={`text-amber-400 fill-amber-400 ${!readonly && 'group-hover:text-amber-500 group-hover:fill-amber-500'} transition-colors`} 
                            />
                        </div>
                    </div>
                );
            })}
            
            {!readonly && (
                <span className="ml-2 text-sm font-bold text-slate-500 w-8">
                    {displayValue > 0 ? displayValue.toFixed(1) : '-'}
                </span>
            )}
        </div>
    );
};

export default StarRatingInput;
