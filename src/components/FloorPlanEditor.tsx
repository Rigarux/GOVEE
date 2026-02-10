'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useFloorPlans, FloorPlanMarker } from '@/context/FloorPlanContext';
import { useDevices } from '@/context/DeviceContext';
import { controlDevice } from '@/lib/govee';
import styles from './FloorPlanEditor.module.css';
import { Button } from './ui/Button';
import { Plus, Trash2, RotateCw, RotateCcw, Upload, ZoomIn, ZoomOut, Maximize, Power, Scaling, Pencil, Layers } from 'lucide-react';
import { useGroups } from '@/context/GroupContext';
import { SegmentControl } from './SegmentControl';
import { controlSegmented } from '@/lib/govee';

export const FloorPlanEditor = ({ roomId, userRole = 'admin' }: { roomId?: string, userRole?: string }) => {
    const isAdmin = userRole === 'admin';
    const { plans, addPlan, updatePlanMarkers, deletePlan, updatePlanName, updateDeviceSegments } = useFloorPlans();
    const { devices, updateDeviceState } = useDevices();
    const { groups } = useGroups();

    // Filter plans for the current room
    const roomPlans = roomId ? plans.filter(p => p.roomId === roomId) : [];

    // State
    const [activePlanId, setActivePlanId] = useState<string | null>(roomPlans[0]?.id || null);
    const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, markerId: string } | null>(null);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDraggingMarker, setIsDraggingMarker] = useState<string | null>(null);
    const [showSegmentControl, setShowSegmentControl] = useState<string | null>(null);

    // Refs
    const fileInputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const editorAreaRef = useRef<HTMLDivElement>(null);
    const dragStartRef = useRef<{ x: number, y: number } | null>(null);
    const initialMarkerPosRef = useRef<{ x: number, y: number } | null>(null);
    const hasMovedRef = useRef<boolean>(false);
    const [isResizingHandle, setIsResizingHandle] = useState<'left' | 'right' | null>(null);
    const initialMarkerWidthRef = useRef<number | null>(null);

    const activePlan = plans.find(p => p.id === activePlanId);

    // Init active plan when room changes or plans update
    useEffect(() => {
        if (!activePlanId || !roomPlans.find(p => p.id === activePlanId)) {
            setActivePlanId(roomPlans[0]?.id || null);
        }
    }, [roomPlans, activePlanId, roomId]);

    // Global click to close context menu
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    // Global mouse up for releasing drag
    useEffect(() => {
        const handleGlobalMouseUp = () => {
            setIsDraggingMarker(null);
            setIsResizingHandle(null);
            dragStartRef.current = null;
            // Delay resetting hasMoved slightly so onClick can read it
            setTimeout(() => {
                hasMovedRef.current = false;
            }, 50);
        };
        const handleGlobalMouseMove = (e: MouseEvent) => {
            if (!activePlan || !containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();

            if (isDraggingMarker && dragStartRef.current && initialMarkerPosRef.current) {
                const dx = e.clientX - dragStartRef.current.x;
                const dy = e.clientY - dragStartRef.current.y;

                if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
                    hasMovedRef.current = true;
                }

                const percentX = (dx / rect.width) * 100;
                const percentY = (dy / rect.height) * 100;

                const newX = initialMarkerPosRef.current.x + percentX;
                const newY = initialMarkerPosRef.current.y + percentY;

                const newMarkers = activePlan.markers.map(m =>
                    m.id === isDraggingMarker ? { ...m, x: newX, y: newY } : m
                );
                updatePlanMarkers(activePlan.id, newMarkers);
            } else if (isResizingHandle && selectedMarkerId) {
                const mouseXInPercent = ((e.clientX - rect.left) / rect.width) * 100;
                const marker = activePlan.markers.find(m => m.id === selectedMarkerId);

                if (marker) {
                    const dx = Math.abs(mouseXInPercent - marker.x);
                    const newWidth = Math.max(5, dx * 2);

                    // Proportionally scale height with width
                    const newHeight = Math.max(2, 5 + (newWidth / 10 - 1));

                    const newMarkers = activePlan.markers.map(m =>
                        m.id === selectedMarkerId ? { ...m, width: newWidth, height: newHeight } : m
                    );
                    updatePlanMarkers(activePlan.id, newMarkers);
                }
            }
        };

        window.addEventListener('mouseup', handleGlobalMouseUp);
        window.addEventListener('mousemove', handleGlobalMouseMove);
        return () => {
            window.removeEventListener('mouseup', handleGlobalMouseUp);
            window.removeEventListener('mousemove', handleGlobalMouseMove);
        };
    }, [isDraggingMarker, isResizingHandle, selectedMarkerId, activePlan, updatePlanMarkers]);


    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && roomId) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                if (ev.target?.result) {
                    addPlan(`Plan ${plans.length + 1}`, ev.target.result as string, roomId);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    // DROP (New Markers)
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!activePlan || !containerRef.current) return;

        const deviceId = e.dataTransfer.getData('deviceId');
        const groupId = e.dataTransfer.getData('groupId');

        if (!deviceId && !groupId) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        // Universal memory: Look for existing segments for this device/group in any existing plan
        const existingSegments = plans
            .flatMap(p => p.markers)
            .find(m => (deviceId && m.deviceId === deviceId) || (groupId && m.groupId === groupId))
            ?.segments;

        const newMarker: FloorPlanMarker = {
            id: crypto.randomUUID(),
            deviceId: deviceId || undefined,
            groupId: groupId || undefined,
            x,
            y,
            rotation: 0,
            width: 10,
            height: 5,
            segments: existingSegments
        };

        updatePlanMarkers(activePlan.id, [...activePlan.markers, newMarker]);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    // MOUSE DOWN (Start Move Existing Marker)
    const handleMarkerMouseDown = (e: React.MouseEvent, marker: FloorPlanMarker) => {
        if (!isAdmin) return;
        if (e.button !== 0) return; // Only Left Click for drag
        e.stopPropagation();

        setIsDraggingMarker(marker.id);
        setIsResizingHandle(null);
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        initialMarkerPosRef.current = { x: marker.x, y: marker.y };
        hasMovedRef.current = false;
        setSelectedMarkerId(marker.id);
    };

    const handleHandleMouseDown = (e: React.MouseEvent, handle: 'left' | 'right') => {
        if (!isAdmin) return;
        e.stopPropagation();
        if (e.button !== 0) return;
        setIsResizingHandle(handle);
        setIsDraggingMarker(null);
    };

    // CONTEXT MENU
    const handleMarkerContextMenu = (e: React.MouseEvent, markerId: string) => {
        if (!isAdmin) return;
        e.preventDefault();
        e.stopPropagation();
        setSelectedMarkerId(markerId);
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            markerId
        });
    };

    // CONTROLS
    const handleDeletePlan = () => {
        if (activePlanId && confirm(`¿Estás seguro de que deseas eliminar el plano "${activePlan?.name}"?`)) {
            deletePlan(activePlanId);
            setActivePlanId(roomPlans.length > 1 ? roomPlans.find(p => p.id !== activePlanId)?.id || null : null);
        }
    };

    const handleRenamePlan = () => {
        if (activePlan) {
            const newName = prompt('Ingrese el nuevo nombre para el plano:', activePlan.name);
            if (newName && newName.trim()) {
                updatePlanName(activePlan.id, newName.trim());
            }
        }
    };

    const handleDeleteMarker = (id: string = selectedMarkerId!) => {
        if (activePlan && id) {
            const newMarkers = activePlan.markers.filter(m => m.id !== id);
            updatePlanMarkers(activePlan.id, newMarkers);
            if (selectedMarkerId === id) setSelectedMarkerId(null);
            setContextMenu(null);
        }
    };

    const handleRotateMarker = (direction: number = 1, id: string = selectedMarkerId!) => {
        if (activePlan && id) {
            const newMarkers = activePlan.markers.map(m => {
                if (m.id === id) {
                    return { ...m, rotation: (m.rotation || 0) + (45 * direction) };
                }
                return m;
            });
            updatePlanMarkers(activePlan.id, newMarkers);
        }
    };

    const handleResizeMarker = (id: string = selectedMarkerId!) => {
        if (activePlan && id) {
            const newMarkers = activePlan.markers.map(m => {
                if (m.id === id) {
                    const currentWidth = m.width || 10;
                    let newWidth = currentWidth + 10;
                    if (newWidth > 40) newWidth = 10;
                    const newHeight = 5 + (newWidth / 10 - 1);
                    return { ...m, width: newWidth, height: newHeight };
                }
                return m;
            });
            updatePlanMarkers(activePlan.id, newMarkers);
        }
    };

    const handleMarkerPowerToggle = async (e: React.MouseEvent, marker: FloorPlanMarker) => {
        e.stopPropagation();
        if (!marker.deviceId) return;

        const device = devices.find(d => d.device === marker.deviceId);
        if (!device) return;

        const newState = device.properties?.powerState === 'on' ? 'off' : 'on';

        // Optimistic update
        updateDeviceState(device.device, { powerState: newState });

        try {
            await controlDevice(device.device, device.model, {
                name: 'turn',
                value: newState
            });
        } catch (error) {
            console.error('Failed to toggle power:', error);
            // Revert on error
            updateDeviceState(device.device, { powerState: device.properties?.powerState });
        }
    };

    const handleApplySegments = async (markerId: string, segments: { color: { r: number; g: number; b: number }; brightness: number }[]) => {
        const marker = activePlan?.markers.find(m => m.id === markerId);
        if (!marker || !marker.deviceId) return;

        const device = devices.find(d => d.device === marker.deviceId);
        if (!device) return;

        try {
            await controlSegmented(device.device, device.model, segments);

            // Universal memory update
            updateDeviceSegments(device.device, segments);

            setShowSegmentControl(null);
        } catch (error) {
            alert('Error al aplicar iluminación por segmentos');
        }
    };

    // ZOOM CONTROLS
    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 3));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
    const handleResetView = () => {
        setZoom(5);
        setPan({ x: 0, y: 0 });
    };

    const getLabel = (marker: FloorPlanMarker) => {
        if (marker.deviceId) {
            return devices.find(d => d.device === marker.deviceId)?.deviceName || 'Desconocido';
        }
        if (marker.groupId) {
            return groups.find(g => g.id === marker.groupId)?.name || 'Grupo';
        }
        return marker.label || 'Marcador';
    };

    return (
        <div className={styles.container}>
            <div className={styles.toolbar}>
                <div className={styles.leftSection}>
                    <div className={styles.plansList}>
                        {roomPlans.map(p => (
                            <Button
                                key={p.id}
                                variant={activePlanId === p.id ? 'primary' : 'ghost'}
                                onClick={() => setActivePlanId(p.id)}
                                className={styles.planTab}
                            >
                                {p.name}
                            </Button>
                        ))}
                    </div>

                    {activePlanId && isAdmin && (
                        <div className="flex items-center gap-1 ml-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleRenamePlan}
                                title="Renombrar Plano"
                            >
                                <Pencil size={18} className="mr-2" /> Renombrar
                            </Button>
                            <Button
                                variant="ghost"
                                className="text-red-500 hover:text-red-600"
                                size="sm"
                                onClick={handleDeletePlan}
                                title="Eliminar Plano"
                            >
                                <Trash2 size={18} className="mr-2" /> Eliminar
                            </Button>
                        </div>
                    )}
                </div>

                <div className={styles.centerSection}>
                    {!activePlanId && isAdmin && (
                        <>
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                accept="image/*"
                                onChange={handleFileUpload}
                                title="Subir plano"
                            />
                            <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                                <Plus size={16} className="mr-2" /> Nuevo Plano
                            </Button>
                        </>
                    )}
                </div>

                <div className={styles.rightSection}>
                    <div className="flex items-center gap-1 border-gray-200">
                        <Button variant="ghost" size="sm" onClick={handleZoomOut} title="Alejar"><ZoomOut size={18} /></Button>
                        <span className="text-xs w-12 text-center text-gray-500">{Math.round(zoom * 100)}%</span>
                        <Button variant="ghost" size="sm" onClick={handleZoomIn} title="Acercar"><ZoomIn size={18} /></Button>
                        <Button variant="ghost" size="sm" onClick={handleResetView} title="Resetear"><Maximize size={18} /></Button>
                    </div>

                    {selectedMarkerId && isAdmin && (
                        <div className="flex items-center ml-2 pl-4 border-l border-gray-200">
                            <Button variant="ghost" size="sm" onClick={() => handleRotateMarker(1, selectedMarkerId!)} title="Rotar">
                                <RotateCw size={18} />
                            </Button>
                            <Button variant="ghost" className="text-red-500 hover:text-red-600" size="sm" onClick={() => handleDeleteMarker(selectedMarkerId!)} title="Eliminar Marcador">
                                <Trash2 size={18} />
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <div
                ref={editorAreaRef}
                className={styles.editorArea}
                onClick={() => {
                    setSelectedMarkerId(null);
                }}
            >
                {activePlan ? (
                    <div
                        ref={containerRef}
                        className={styles.canvasContainer}
                        style={{
                            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
                            transformOrigin: 'center center',
                            transition: isDraggingMarker ? 'none' : 'transform 0.1s ease-out'
                        }}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                    >
                        <img src={activePlan.imageData} alt="Floor Plan" className={styles.floorPlanImage} />

                        {activePlan.markers.map(marker => {
                            const isSelected = selectedMarkerId === marker.id;
                            const device = marker.deviceId ? devices.find(d => d.device === marker.deviceId) : null;
                            const isOff = device?.properties?.powerState === 'off';
                            const deviceColor = device?.properties?.color;

                            // Color logic: if off, use gray. if on, use device color or default orange.
                            const lightColor = deviceColor
                                ? `rgb(${deviceColor.r}, ${deviceColor.g}, ${deviceColor.b})`
                                : 'rgba(249, 115, 22, 1)';

                            const glowColor = deviceColor
                                ? `rgba(${deviceColor.r}, ${deviceColor.g}, ${deviceColor.b}, 0.5)`
                                : 'rgba(249, 115, 22, 0.5)';

                            return (
                                <div
                                    key={marker.id}
                                    className={`
                                        ${styles.marker} 
                                        ${isSelected ? styles.markerSelected : ''} 
                                        ${isOff ? styles.markerOff : ''}
                                    `}
                                    style={{
                                        left: `${marker.x}%`,
                                        top: `${marker.y}%`,
                                        width: `${marker.width || 10}%`,
                                        height: `${marker.height || 5}%`,
                                        transform: `translate(-50%, -50%) rotate(${marker.rotation || 0}deg)`,
                                        cursor: isDraggingMarker === marker.id ? 'grabbing' : 'grab'
                                    }}
                                    onMouseDown={(e) => handleMarkerMouseDown(e, marker)}
                                    onContextMenu={(e) => handleMarkerContextMenu(e, marker.id)}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (!isAdmin && !hasMovedRef.current) {
                                            handleMarkerPowerToggle(e, marker);
                                        }
                                    }}
                                >
                                    <div className={styles.markerContent}>
                                        <div
                                            className={styles.lightBar}
                                            style={{
                                                background: isOff
                                                    ? '#9ca3af'
                                                    : !marker.segments
                                                        ? `linear-gradient(90deg, ${lightColor} 0%, ${lightColor} 50%, ${lightColor} 100%)`
                                                        : 'transparent',
                                                boxShadow: isOff ? 'none' : `0 0 15px ${glowColor}`
                                            }}
                                        >
                                            {!isOff && marker.segments && marker.segments.map((s, idx) => (
                                                <div
                                                    key={idx}
                                                    className={styles.miniSegment}
                                                    style={{
                                                        backgroundColor: `rgb(${s.color.r}, ${s.color.g}, ${s.color.b})`,
                                                        opacity: s.brightness / 100
                                                    }}
                                                />
                                            ))}
                                        </div>
                                        <span className={styles.markerLabel}>{getLabel(marker)}</span>
                                    </div>

                                    {isSelected && (
                                        <>
                                            <div
                                                className={`${styles.resizeHandle} ${styles.handleLeft}`}
                                                onMouseDown={(e) => handleHandleMouseDown(e, 'left')}
                                            />
                                            <div
                                                className={`${styles.resizeHandle} ${styles.handleRight}`}
                                                onMouseDown={(e) => handleHandleMouseDown(e, 'right')}
                                            />
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className={styles.emptyState}>
                        <div className="mb-6 p-6 bg-gray-100 rounded-full">
                            <Upload size={48} className="text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No tienes planos aún</h3>
                        <p className="text-gray-500 mb-6 max-w-sm">Sube una imagen de tu local para comenzar a ubicar tus luces.</p>
                        <Button onClick={() => fileInputRef.current?.click()} className="px-8">
                            Subir Imagen de Plano
                        </Button>
                    </div>
                )}
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <div
                    className={styles.contextMenu}
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Power Toggle removed for Admin as per request */}
                    {false && (
                        <div
                            className={styles.contextMenuItem}
                            onClick={() => {
                                if (contextMenu) {
                                    const marker = activePlan?.markers.find(m => m.id === contextMenu.markerId);
                                    if (marker) handleMarkerPowerToggle({ stopPropagation: () => { } } as any, marker);
                                    setContextMenu(null);
                                }
                            }}
                        >
                            <Power size={14} /> Encender / Apagar
                        </div>
                    )}
                    {activePlan?.markers.find(m => m.id === contextMenu.markerId)?.deviceId && (
                        <div
                            className={styles.contextMenuItem}
                            onClick={() => {
                                setShowSegmentControl(contextMenu.markerId);
                                setContextMenu(null);
                            }}
                        >
                            <Layers size={14} /> Control por Segmentos
                        </div>
                    )}
                    <div className={styles.contextMenuLabel}>Editar</div>
                    <div className={styles.editGroup}>
                        <button
                            className={styles.editBtn}
                            onClick={() => handleRotateMarker(-1, contextMenu.markerId)}
                            title="Girar Antihorario"
                        >
                            <RotateCcw size={16} />
                        </button>
                        <button
                            className={styles.editBtn}
                            onClick={() => handleRotateMarker(1, contextMenu.markerId)}
                            title="Girar Horario"
                        >
                            <RotateCw size={16} />
                        </button>
                    </div>
                    <div className={styles.contextMenuDivider}></div>
                    <div
                        className={`${styles.contextMenuItem} ${styles.danger}`}
                        onClick={() => {
                            handleDeleteMarker(contextMenu.markerId);
                        }}
                    >
                        <Trash2 size={14} /> Eliminar
                    </div>
                </div>
            )}

            {showSegmentControl && (
                <SegmentControl
                    deviceName={getLabel(activePlan!.markers.find(m => m.id === showSegmentControl)!)}
                    initialSegments={activePlan!.markers.find(m => m.id === showSegmentControl)!.segments}
                    onClose={() => setShowSegmentControl(null)}
                    onApply={(segments) => handleApplySegments(showSegmentControl, segments)}
                />
            )}
        </div>
    );
};
