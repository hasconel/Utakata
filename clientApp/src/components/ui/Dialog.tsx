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
      <HeadlessDialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25 dark:bg-black/50" />
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
              <HeadlessDialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl transition-all">
                <HeadlessDialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">
                  {title}
                </HeadlessDialog.Title>
                {description && (
                  <HeadlessDialog.Description className="mt-2 text-sm text-gray-500 dark:text-gray-400">
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