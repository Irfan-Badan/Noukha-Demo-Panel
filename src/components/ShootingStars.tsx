"use client";
import { cn } from "@/lib/utils";
import React, { useEffect, useState, useRef } from "react";

interface ShootingStar {
    id: number;
    x: number;
    y: number;
    angle: number;
    scale: number;
    speed: number;
    distance: number;
}

interface ShootingStarsProps {
    minSpeed?: number;
    maxSpeed?: number;
    minDelay?: number;
    maxDelay?: number;
    starColor?: string;
    trailColor?: string;
    starWidth?: number;
    starHeight?: number;
    className?: string;
}

const getRandomStartPoint = () => {
    if (typeof window === "undefined") return { x: 0, y: 0, angle: 45 };
    const side = Math.floor(Math.random() * 4);
    const offset = Math.random() * window.innerWidth;

    switch (side) {
        case 0:
            return { x: offset, y: 0, angle: 45 };
        case 1:
            return { x: window.innerWidth, y: offset, angle: 135 };
        case 2:
            return { x: offset, y: window.innerHeight, angle: 225 };
        case 3:
            return { x: 0, y: offset, angle: 315 };
        default:
            return { x: 0, y: 0, angle: 45 };
    }
};
export const ShootingStars: React.FC<ShootingStarsProps> = ({
    minSpeed = 10,
    maxSpeed = 30,
    minDelay = 1200,
    maxDelay = 4200,
    starColor = "#9E00FF",
    trailColor = "#2EB9DF",
    starWidth = 10,
    starHeight = 1,
    className,
}) => {
    const [star, setStar] = useState<ShootingStar | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const starRef = useRef<ShootingStar | null>(null);
    const animationFrameRef = useRef<number>(0);

    useEffect(() => {
        let timeoutId: ReturnType<typeof setTimeout>;

        const createStar = () => {
            const { x, y, angle } = getRandomStartPoint();
            const newStar: ShootingStar = {
                id: Date.now(),
                x,
                y,
                angle,
                scale: 1,
                speed: Math.random() * (maxSpeed - minSpeed) + minSpeed,
                distance: 0,
            };
            starRef.current = newStar;
            setStar(newStar);

            const randomDelay = Math.random() * (maxDelay - minDelay) + minDelay;
            timeoutId = setTimeout(createStar, randomDelay);
        };

        const animate = () => {
            if (starRef.current) {
                const prevStar = starRef.current;
                const newX = prevStar.x + prevStar.speed * Math.cos((prevStar.angle * Math.PI) / 180);
                const newY = prevStar.y + prevStar.speed * Math.sin((prevStar.angle * Math.PI) / 180);
                const newDistance = prevStar.distance + prevStar.speed;
                const newScale = 1 + newDistance / 100;

                if (
                    newX < -20 ||
                    newX > (typeof window !== "undefined" ? window.innerWidth : 0) + 20 ||
                    newY < -20 ||
                    newY > (typeof window !== "undefined" ? window.innerHeight : 0) + 20
                ) {
                    starRef.current = null;
                    setStar(null);
                } else {
                    const updated = { ...prevStar, x: newX, y: newY, distance: newDistance, scale: newScale };
                    starRef.current = updated;
                    setStar(updated);
                }
            }
            animationFrameRef.current = requestAnimationFrame(animate);
        };

        createStar();
        animationFrameRef.current = requestAnimationFrame(animate);

        return () => {
            clearTimeout(timeoutId);
            cancelAnimationFrame(animationFrameRef.current);
        };
    }, [minSpeed, maxSpeed, minDelay, maxDelay]);

    return (
        <svg
            ref={svgRef}
            className={cn("w-full h-full absolute inset-0", className)}
        >
            {star && (
                <rect
                    key={star.id}
                    x={star.x}
                    y={star.y}
                    width={starWidth * star.scale}
                    height={starHeight}
                    fill="url(#gradient)"
                    transform={`rotate(${star.angle}, ${star.x + (starWidth * star.scale) / 2
                        }, ${star.y + starHeight / 2})`}
                />
            )}
            <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: trailColor, stopOpacity: 0 }} />
                    <stop
                        offset="100%"
                        style={{ stopColor: starColor, stopOpacity: 1 }}
                    />
                </linearGradient>
            </defs>
        </svg>
    );
};
