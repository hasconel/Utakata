"use client";

import { Fragment } from "react";
import { Dialog as HeadlessDialog, Transition } from "@headlessui/react";

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

/**
 * ダイアログコンポーネント！✨
 * モーダル表示をかわいく実装するよ！💖
 */
export function Dialog({ isOpen, onClose, title, description, children }: DialogProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      {/* Modal（z-[10000]）の上にも出せるように、それより上に置く */}
      <HeadlessDialog as="div" className="relative z-[10050]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <HeadlessDialog.Panel className="w-full max-w-sm transform overflow-hidden rounded-2xl bg-card p-5 text-card-foreground shadow-float transition-all">
                <HeadlessDialog.Title as="h3" className="text-base font-semibold leading-6 text-foreground">
                  {title}
                </HeadlessDialog.Title>
                {description && (
                  <HeadlessDialog.Description className="mt-1.5 text-sm text-muted-foreground">
                    {description}
                  </HeadlessDialog.Description>
                )}
                <div className="mt-4">{children}</div>
              </HeadlessDialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </HeadlessDialog>
    </Transition>
  );
} 