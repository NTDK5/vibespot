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
  Image
} from 'react-native';
import { Button } from '../components/Button';
// import { registerWithEmail, signInWithGoogle } from '../services/auth';
import { isValidEmail, isValidPassword } from '../utils/helpers';

/**
 * Register Screen
 */
export const RegisterScreen = ({ navigation }) => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const handleRegister = async () => {
    // if (!displayName || !email || !password || !confirmPassword) {
    //   Alert.alert('Error', 'Please fill in all fields');
    //   return;
    // }

    // if (!isValidEmail(email)) {
    //   Alert.alert('Error', 'Please enter a valid email address');
    //   return;
    // }

    // if (!isValidPassword(password)) {
    //   Alert.alert('Error', 'Password must be at least 6 characters');
    //   return;
    // }

    // if (password !== confirmPassword) {
    //   Alert.alert('Error', 'Passwords do not match');
    //   return;
    // }

    // setLoading(true);
    // const { user, error } = await registerWithEmail(email, password, displayName);
    // setLoading(false);

    // if (error) {
    //   Alert.alert('Registration Failed', error);
    // } else {
    //   Alert.alert('Success', 'Account created successfully!');
    // }

    Alert.alert('Register', 'Registration disabled');
  };

  const handleGoogleSignUp = async () => {
    // setLoading(true);
    // const { user, error } = await signInWithGoogle();
    // setLoading(false);

    // if (error) {
    //   Alert.alert('Registration Failed', error);
    // }
    Alert.alert('Google Sign Up', 'Google sign up disabled');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
        <Image
        source={require("../../assets/logo.png")}
        style={styles.logo}
      />
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join VibeSpot and discover amazing places</Text>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
            />

            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <Button
              title="Sign Up"
              onPress={handleRegister}
              loading={loading}
              style={styles.button}
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <Button
              title="Sign up with Google"
              onPress={handleGoogleSignUp}
              variant="secondary"
              loading={loading}
              style={styles.button}
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Text
                style={styles.footerLink}
                onPress={() => navigation.navigate('Login')}
              >
                Sign In
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 24,
  },
  content: {
    padding: 24,
  },
  logo: {
    width: 150,
    height: 150,
    alignSelf: 'center',
    marginBottom: 10,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
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
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#999',
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
  footerLink: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
});