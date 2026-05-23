/**
 * useWalletModal
 *
 * A tiny React context that lets any component open/close the wallet
 * selection modal without prop-drilling.
 *
 * Also contains an auto-connect bridge: once the user picks a wallet inside
 * the modal, the adapter context updates `wallet` to the chosen adapter.
 * We watch for that transition and fire `connect()` automatically — this
 * is what makes the *first* click work end-to-end (previously connect()
 * was fired in the same tick as select() and raced against the modal
 * unmount, producing WalletNotSelectedError).
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletModal } from "@/components/WalletModal";

interface ModalCtx {
  openModal: () => void;
  closeModal: () => void;
}

const WalletModalCtx = createContext<ModalCtx>({
  openModal: () => {},
  closeModal: () => {},
});

/**
 * Watches the wallet adapter context and fires connect() whenever a wallet
 * is freshly selected but not yet connected/connecting. This decouples the
 * select() call (made inside WalletModal) from the connect() call (made
 * here, after React has flushed the selection state).
 */
function AutoConnectBridge() {
  const { wallet, connect, connected, connecting } = useWallet();
  const lastAttemptedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!wallet) {
      lastAttemptedRef.current = null;
      return;
    }
    if (connected || connecting) return;

    const name = wallet.adapter.name;
    // Avoid retry-loops if the user rejects the connection prompt
    if (lastAttemptedRef.current === name) return;
    lastAttemptedRef.current = name;

    connect().catch(() => {
      // User rejected or extension errored — leave selection in place so
      // the user can retry by clicking "Connect" again.
    });
  }, [wallet, connect, connected, connecting]);

  return null;
}

export function WalletModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const openModal = useCallback(() => setOpen(true), []);
  const closeModal = useCallback(() => setOpen(false), []);

  return (
    <WalletModalCtx.Provider value={{ openModal, closeModal }}>
      {children}
      <AutoConnectBridge />
      <WalletModal open={open} onClose={closeModal} />
    </WalletModalCtx.Provider>
  );
}

export function useWalletModal() {
  return useContext(WalletModalCtx);
}
