import React from "react";
import { Eye, ListChecks } from "lucide-react"; // fallback icon

export default function IconButton({
    iconKey,
    label,
    onClick,
    variant = "info",
    size = "sm",
    className = "",
    maxWidth,
    showEllipsis = false,
    ...props
}) {
    const IconComponent = getIconComponent(iconKey);

    const ellipsisStyle = showEllipsis
        ? {
            maxWidth: maxWidth || "140px",
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
        }
        : {};

    return (
        <button
            type="button"
            onClick={onClick}
            style={ellipsisStyle}
            className={`btn btn-${variant} btn-${size} btn-${size} mt-2 px-3 py-2 rounded-pill btn-shadow fw-semibold d-inline-flex align-items-center gap-2 ${className}`}
            {...props}
        >
            <IconComponent size={16} className="flex-shrink-0" />
            <span className="text-truncate">{label}</span>
            <Eye size={16} />
        </button>
    );
}

// --- Move your icon map here or import from another file
function getIconComponent(key) {
    const icons = {
        FileText: ({ size, className }) => (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={className}
            >
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
        ),
        ShoppingCart: ({ size, className }) => (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={className}
            >
                <circle cx="8" cy="21" r="1"></circle>
                <circle cx="19" cy="21" r="1"></circle>
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.72a2 2 0 0 0 2-1.58L23 6H6"></path>
            </svg>
        ),
        Truck: ({ size, className }) => (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={className}
            >
                <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"></path>
                <path d="M15 18H9"></path>
                <path d="M19 18h2a1 1 0 0 0 1-1v-5"></path>
                <circle cx="17" cy="18" r="2"></circle>
                <circle cx="7" cy="18" r="2"></circle>
            </svg>
        ),
    };

    return icons[key] || ((props) => <ListChecks {...props} />);
}
