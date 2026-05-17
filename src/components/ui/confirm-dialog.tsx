"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    loading?: boolean;
}

export default function ConfirmDialog({
    isOpen,
    title,
    message,
    confirmLabel = "Delete",
    onConfirm,
    onCancel,
    loading = false,
}: ConfirmDialogProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <Card className="w-full max-w-sm border-surface-100/50 bg-surface-50 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <CardHeader className="pb-2 pt-6 px-6 flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
                        <AlertTriangle className="w-6 h-6 text-red-500" />
                    </div>
                    <CardTitle className="text-lg">{title}</CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6 pt-2 text-center">
                    <p className="text-sm text-surface-200 mb-6">{message}</p>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={onCancel}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="danger"
                            className="flex-1"
                            onClick={onConfirm}
                            disabled={loading}
                        >
                            {loading ? "Deleting..." : confirmLabel}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
