/**
 * Icons Component - React Native SVG Icons
 * Maps lucide-react icons to React Native SVG components
 */

import React from 'react';
import Svg, { Path, Circle, Line, Rect, Polyline, Polygon } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const defaultSize = 24;
const defaultColor = '#000000';
const defaultStrokeWidth = 2;

export const Menu: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, strokeWidth = defaultStrokeWidth }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Line x1="4" y1="12" x2="20" y2="12" />
    <Line x1="4" y1="6" x2="20" y2="6" />
    <Line x1="4" y1="18" x2="20" y2="18" />
  </Svg>
);

export const X: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, strokeWidth = defaultStrokeWidth }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Line x1="18" y1="6" x2="6" y2="18" />
    <Line x1="6" y1="6" x2="18" y2="18" />
  </Svg>
);

export const Heart: React.FC<IconProps & { filled?: boolean }> = ({ size = defaultSize, color = defaultColor, strokeWidth = defaultStrokeWidth, filled = false }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </Svg>
);

export const ShoppingBag: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, strokeWidth = defaultStrokeWidth }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <Line x1="3" y1="6" x2="21" y2="6" />
    <Path d="M16 10a4 4 0 0 1-8 0" />
  </Svg>
);

export const ArrowLeft: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, strokeWidth = defaultStrokeWidth }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Line x1="19" y1="12" x2="5" y2="12" />
    <Path d="M12 19l-7-7 7-7" />
  </Svg>
);

export const ArrowRight: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, strokeWidth = defaultStrokeWidth }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Line x1="5" y1="12" x2="19" y2="12" />
    <Path d="M12 5l7 7-7 7" />
  </Svg>
);

export const User: React.FC<IconProps & { fill?: string }> = ({ size = defaultSize, color = defaultColor, strokeWidth = defaultStrokeWidth, fill }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={fill || 'none'} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <Circle cx="12" cy="7" r="4" />
  </Svg>
);

export const Globe: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, strokeWidth = defaultStrokeWidth }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="10" />
    <Line x1="2" y1="12" x2="22" y2="12" />
    <Path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </Svg>
);

export const Ticket: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, strokeWidth = defaultStrokeWidth }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z" />
    <Path d="M13 5v2" />
    <Path d="M13 17v2" />
    <Path d="M13 11v2" />
  </Svg>
);

export const Copy: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, strokeWidth = defaultStrokeWidth }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <Path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </Svg>
);

export const Check: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, strokeWidth = defaultStrokeWidth }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 6L9 17l-5-5" />
  </Svg>
);

export const Trash2: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, strokeWidth = defaultStrokeWidth }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 6h18" />
    <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <Line x1="10" y1="11" x2="10" y2="17" />
    <Line x1="14" y1="11" x2="14" y2="17" />
  </Svg>
);

export const Share2: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, strokeWidth = defaultStrokeWidth }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="18" cy="5" r="3" />
    <Circle cx="6" cy="12" r="3" />
    <Circle cx="18" cy="19" r="3" />
    <Line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <Line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </Svg>
);

export const Link2: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, strokeWidth = defaultStrokeWidth }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M15 7h3a5 5 0 0 1 5 5 5 5 0 0 1-5 5h-3m-6 0H6a5 5 0 0 1-5-5 5 5 0 0 1 5-5h3" />
    <Line x1="8" y1="12" x2="16" y2="12" />
  </Svg>
);

export const Instagram: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, strokeWidth = defaultStrokeWidth }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <Path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <Line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </Svg>
);

export const MessageCircle: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, strokeWidth = defaultStrokeWidth }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </Svg>
);

export const ShoppingCart: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, strokeWidth = defaultStrokeWidth }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="9" cy="21" r="1" />
    <Circle cx="20" cy="21" r="1" />
    <Path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </Svg>
);

export const Loader2: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, strokeWidth = defaultStrokeWidth }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="10" opacity="0.25" />
    <Path d="M12 2a10 10 0 0 1 10 10" opacity="0.75" />
  </Svg>
);

export const Trophy: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, strokeWidth = defaultStrokeWidth }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2" />
    <Path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2" />
    <Path d="M6 9v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V9" />
    <Path d="M6 9a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2" />
    <Circle cx="12" cy="15" r="1" />
  </Svg>
);

export const Sparkles: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, strokeWidth = defaultStrokeWidth }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    <Circle cx="12" cy="12" r="2" />
  </Svg>
);

export const Plus: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, strokeWidth = defaultStrokeWidth }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Line x1="12" y1="5" x2="12" y2="19" />
    <Line x1="5" y1="12" x2="19" y2="12" />
  </Svg>
);

export const Minus: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, strokeWidth = defaultStrokeWidth }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Line x1="5" y1="12" x2="19" y2="12" />
  </Svg>
);

export const Maximize2: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, strokeWidth = defaultStrokeWidth }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
  </Svg>
);

export const ChevronRight: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, strokeWidth = defaultStrokeWidth }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M9 18l6-6-6-6" />
  </Svg>
);

export const ChevronLeft: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, strokeWidth = defaultStrokeWidth }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M15 18l-6-6 6-6" />
  </Svg>
);

export const Star: React.FC<IconProps & { filled?: boolean }> = ({ size = defaultSize, color = defaultColor, strokeWidth = defaultStrokeWidth, filled = false }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </Svg>
);

export const Tag: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, strokeWidth = defaultStrokeWidth }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <Circle cx="7" cy="7" r="1.5" />
  </Svg>
);

export const Ruler: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, strokeWidth = defaultStrokeWidth }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21.3 8.7l-5.6-5.6a2 2 0 0 0-2.8 0L2.7 12.3a2 2 0 0 0 0 2.8l5.6 5.6a2 2 0 0 0 2.8 0L21.3 11.5a2 2 0 0 0 0-2.8z" />
    <Line x1="7.5" y1="4.5" x2="9.5" y2="6.5" />
    <Line x1="4.5" y1="7.5" x2="6.5" y2="9.5" />
    <Line x1="19.5" y1="11.5" x2="17.5" y2="13.5" />
    <Line x1="14.5" y1="16.5" x2="16.5" y2="18.5" />
  </Svg>
);

export const Facebook: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, strokeWidth = defaultStrokeWidth }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
    <Path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </Svg>
);

export const Twitter: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, strokeWidth = defaultStrokeWidth }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
    <Path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
  </Svg>
);

export const Linkedin: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, strokeWidth = defaultStrokeWidth }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
    <Path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <Rect x="2" y="9" width="4" height="12" />
    <Circle cx="4" cy="4" r="2" />
  </Svg>
);

export const CheckCircle2: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, strokeWidth = defaultStrokeWidth }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="10" />
    <Path d="M9 12l2 2 4-4" />
  </Svg>
);

export const MessageSquare: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, strokeWidth = defaultStrokeWidth }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </Svg>
);

export const Search: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, strokeWidth = defaultStrokeWidth }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="11" cy="11" r="8" />
    <Path d="m21 21-4.35-4.35" />
  </Svg>
);

export const ShieldCheck: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, strokeWidth = defaultStrokeWidth }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <Path d="M9 12l2 2 4-4" />
  </Svg>
);

export const QrCode: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, strokeWidth = defaultStrokeWidth }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="3" y="3" width="5" height="5" />
    <Rect x="16" y="3" width="5" height="5" />
    <Rect x="3" y="16" width="5" height="5" />
    <Line x1="7" y1="8" x2="7" y2="8" />
    <Line x1="20" y1="8" x2="20" y2="8" />
    <Line x1="7" y1="16" x2="7" y2="16" />
    <Path d="M16 16h3M16 20h3M12 12h3v3M12 12v3h3" />
  </Svg>
);

export const CreditCard: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, strokeWidth = defaultStrokeWidth }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <Line x1="1" y1="10" x2="23" y2="10" />
  </Svg>
);

export const MapPin: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, strokeWidth = defaultStrokeWidth }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <Circle cx="12" cy="10" r="3" />
  </Svg>
);

export const Navigation: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, strokeWidth = defaultStrokeWidth }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Polygon points="3 11 22 2 13 21 11 13 3 11" />
  </Svg>
);

export const PlusCircle: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, strokeWidth = defaultStrokeWidth }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="10" />
    <Line x1="12" y1="8" x2="12" y2="16" />
    <Line x1="8" y1="12" x2="16" y2="12" />
  </Svg>
);

export const MinusCircle: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, strokeWidth = defaultStrokeWidth }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="10" />
    <Line x1="8" y1="12" x2="16" y2="12" />
  </Svg>
);

export const Truck: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, strokeWidth = defaultStrokeWidth }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z" />
    <Circle cx="5.5" cy="18.5" r="2.5" />
    <Circle cx="18.5" cy="18.5" r="2.5" />
  </Svg>
);

export const Lock: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, strokeWidth = defaultStrokeWidth }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </Svg>
);

export const AlertCircle: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, strokeWidth = defaultStrokeWidth }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="10" />
    <Line x1="12" y1="8" x2="12" y2="12" />
    <Line x1="12" y1="16" x2="12.01" y2="16" />
  </Svg>
);

export const Download: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, strokeWidth = defaultStrokeWidth }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <Polyline points="7 10 12 15 17 10" />
    <Line x1="12" y1="15" x2="12" y2="3" />
  </Svg>
);

export const Calendar: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, strokeWidth = defaultStrokeWidth }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <Line x1="16" y1="2" x2="16" y2="6" />
    <Line x1="8" y1="2" x2="8" y2="6" />
    <Line x1="3" y1="10" x2="21" y2="10" />
  </Svg>
);

export const Clock: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, strokeWidth = defaultStrokeWidth }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="10" />
    <Polyline points="12 6 12 12 16 14" />
  </Svg>
);

export const DollarSign: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, strokeWidth = defaultStrokeWidth }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Line x1="12" y1="1" x2="12" y2="23" />
    <Path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </Svg>
);

export const RefreshCw: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, strokeWidth = defaultStrokeWidth }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="23 4 23 10 17 10" />
    <Polyline points="1 20 1 14 7 14" />
    <Path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </Svg>
);

export const XCircle: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, strokeWidth = defaultStrokeWidth }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="10" />
    <Line x1="15" y1="9" x2="9" y2="15" />
    <Line x1="9" y1="9" x2="15" y2="15" />
  </Svg>
);

export const LogOut: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, strokeWidth = defaultStrokeWidth }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <Polyline points="16 17 21 12 16 7" />
    <Line x1="21" y1="12" x2="9" y2="12" />
  </Svg>
);

export const Apple: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, strokeWidth = defaultStrokeWidth }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
  </Svg>
);

export const Package: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, strokeWidth = defaultStrokeWidth }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
    <Path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <Polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <Line x1="12" y1="22.08" x2="12" y2="12" />
  </Svg>
);

export const Phone: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, strokeWidth = defaultStrokeWidth }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </Svg>
);

export const Mail: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, strokeWidth = defaultStrokeWidth }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <Polyline points="22,6 12,13 2,6" />
  </Svg>
);

export const FileText: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, strokeWidth = defaultStrokeWidth }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <Polyline points="14 2 14 8 20 8" />
    <Line x1="16" y1="13" x2="8" y2="13" />
    <Line x1="16" y1="17" x2="8" y2="17" />
    <Polyline points="10 9 9 9 8 9" />
  </Svg>
);

export const Home: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, strokeWidth = defaultStrokeWidth }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <Polyline points="9 22 9 12 15 12 15 22" />
  </Svg>
);

export const Eye: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, strokeWidth = defaultStrokeWidth }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <Circle cx="12" cy="12" r="3" />
  </Svg>
);

export const EyeOff: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, strokeWidth = defaultStrokeWidth }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <Line x1="1" y1="1" x2="23" y2="23" />
  </Svg>
);

export const Upload: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, strokeWidth = defaultStrokeWidth }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <Polyline points="17 8 12 3 7 8" />
    <Line x1="12" y1="3" x2="12" y2="15" />
  </Svg>
);

export const ThumbsUp: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, strokeWidth = defaultStrokeWidth }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M7 10v12M7 10l-4-4 4-4M7 10h14a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-7l-4 4v-4H7a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2z" />
  </Svg>
);

export const Edit2: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, strokeWidth = defaultStrokeWidth }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </Svg>
);
