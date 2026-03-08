import React from 'react';
import {
  Dialog,
  Flex,
  Typography,
  Button,
  Box,
} from '@strapi/design-system';
import { WarningCircle } from '@strapi/icons';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Content>
        <Dialog.Header>{title}</Dialog.Header>
        <Dialog.Body>
          <Flex gap={3} alignItems="flex-start">
            <Box color={variant === 'danger' ? 'danger600' : 'primary600'}>
              <WarningCircle width="24px" height="24px" />
            </Box>
            <Typography>{message}</Typography>
          </Flex>
        </Dialog.Body>
        <Dialog.Footer>
          <Button onClick={onClose} variant="tertiary" disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            onClick={onConfirm}
            variant={variant}
            loading={isLoading}
          >
            {confirmLabel}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  );
};
