import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
  TouchableOpacity
} from 'react-native';
import { Button } from '../components/Button';
// import { signInWithEmail, signInWithGoogle } from '../services/auth';
import { isValidEmail } from '../utils/helpers';
import { useAuth } from "../hooks/useAuth"
import { useTheme } from "../context/ThemeContext";
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from "expo-linear-gradient";


/**
 * Login Screen
 */
export const LoginScreen = ({ navigation }) => {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { theme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);

  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    setLoading(true);
    const { user, error } = await login(email, password);
    setLoading(false);

    if (error) {
      Alert.alert("Login Failed", error);
      return;
    }

    Alert.alert("Success", "Logged in successfully");

    // navigation.respot("MainTabs");
  };


  return (
    <LinearGradient
      colors={["#007A8C", "#0FA4B8"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
      >

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <View style={[styles.card, { backgroundColor: theme.surface }]}>
              <Image
                source={require("../../assets/logo.png")}
                style={styles.logo}
              />
              <Text style={[styles.title, { color: theme.text }]}>Welcome to VibeSpot</Text>
              <Text style={[styles.subtitle, { color: theme.text }]}>Discover amazing spots around you</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Ionicons name="mail-outline" size={20} color={theme.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Email"
                  placeholderTextColor={theme.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect={false}
                />
              </View>

              <View style={[styles.inputContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Password"
                  placeholderTextColor={theme.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password-new"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color={theme.textMuted}
                  />
                </TouchableOpacity>
              </View>

              <Button
                title="Sign In"
                onPress={handleEmailLogin}
                loading={loading}
                style={[styles.button, { backgroundColor: theme.primary }]}
              />

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={[styles.dividerText, { color: theme.text }]}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              <Button
                title="Sign in with Google"
                onPress={() => { }}
                variant="secondary"
                loading={loading}
                style={[styles.button, { backgroundColor: theme.primary }]}
              />

              <View style={styles.footer}>
                <Text style={[styles.footerText, { color: theme.text }]}>Don't have an account? < Text style={[styles.footerLink, { color: theme.text }]} onPress={() => navigation.navigate('Register')}>Sign Up</Text></Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    padding: 24,
  },
  logo: {
    width: 100,
    height: 100,
    alignSelf: 'center',
    marginBottom: 20,
    resizeMode: 'contain',
  },
  card: {
    width: "100%",
    borderRadius: 20,
    padding: 20,
    marginTop: 40,

    // iOS shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,

    // Android elevation
    elevation: 8,
  },

  title: {
    fontSize: 32,
    fontWeight: 'bold',
    // color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  eyeIcon: {
    padding: 16,
  },
  subtitle: {
    fontSize: 16,
    // color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    // borderColor: '#E0E0E0',
  },
  inputIcon: {
    marginLeft: 16,
  },
  input: {
    flex: 1,
    padding: 16,
    fontSize: 16,
  },
  button: {
    marginBottom: 16,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    // backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 16,
    // color: '#999',
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    // color: '#666',
  },
  footerLink: {
    fontSize: 14,
    // color: '#007AFF',
    fontWeight: '600',
  },
});