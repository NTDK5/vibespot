import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { setToastHandler } from "../utils/toastBus";

const ToastContext = createContext(null);

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const { theme } = useTheme();
  const [toast, setToast] = useState(null); // { message, variant }
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-10)).current;
  const hideTimer = useRef(null);

  const hide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -10, duration: 160, useNativeDriver: true }),
    ]).start(() => setToast(null));
  }, [opacity, translateY]);

  const show = useCallback(
    (message, options = {}) => {
      const { variant = "info", durationMs = 2600 } = options || {};
      if (!message) return;

      setToast({ message, variant });
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();

      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(hide, durationMs);
    },
    [hide, opacity, translateY]
  );

  useEffect(() => {
    setToastHandler(show);
    return () => setToastHandler(null);
  }, [show]);

  const ctx = useMemo(() => ({ show }), [show]);

  const bg =
    toast?.variant === "success"
      ? theme.success
      : toast?.variant === "error"
        ? theme.error
        : toast?.variant === "warning"
          ? theme.warning
          : theme.surfaceHighest || theme.surface;

  const textColor = toast?.variant === "info" ? theme.text : "#0B0D12";

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      {toast ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.wrap,
            {
              opacity,
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={[styles.toast, { backgroundColor: bg, borderColor: theme.border }]}>
            <Text style={[styles.text, { color: textColor }]} numberOfLines={2}>
              {toast.message}
            </Text>
          </View>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: 14,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  toast: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
  },
  text: {
    fontSize: 13,
    fontWeight: "700",
  },
});

