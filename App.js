import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Platform, Modal, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { createClient } from '@supabase/supabase-js';

// Supabase Configuration
const SUPABASE_URL = 'https://hrwrhdnashiahknjrlls.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_7dassAiNzckPWBBOvAnsuQ_voeSR9Rr';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function App() {
  const [screen, setScreen] = useState(1);
  const [loggedInUser, setLoggedInUser] = useState('');
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Auth Inputs
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');

  // Forgot Password States
  const [isForgotPasswordVisible, setIsForgotPasswordVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);

  // CAPTCHA States
  const [captchaCode, setCaptchaCode] = useState('');
  const [userCaptchaInput, setUserCaptchaInput] = useState('');

  // Profile & Settings States
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Commute & Budget States
  const [vehicle, setVehicle] = useState('jeep');
  const [discountType, setDiscountType] = useState('student');
  const [origin, setOrigin] = useState('Savemore Biñan');
  const [destination, setDestination] = useState('Balibago Complex');
  const [budget, setBudget] = useState(200.00);
  const [history, setHistory] = useState([]);

  // Modals & Map States
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [amountToAdd, setAmountToAdd] = useState('');
  const [calculatedFare, setCalculatedFare] = useState(null);
  const [distanceKm, setDistanceKm] = useState(0);
  const [isSearchingMap, setIsSearchingMap] = useState(false);
  const [routeGuide, setRouteGuide] = useState(null);

  // Feature States
  const [isEmergencyModalVisible, setIsEmergencyModalVisible] = useState(false);
  const [lastPaidTrip, setLastPaidTrip] = useState(null);
  const [isReceiptModalVisible, setIsReceiptModalVisible] = useState(false);
  const [isRushHour, setIsRushHour] = useState(false);

  const [mapBbox, setMapBbox] = useState('121.05%2C14.25%2C121.15%2C14.35');
  const [mapMarkerUrl, setMapMarkerUrl] = useState('');

  // Generate 4-digit Random Security Code
  const generateCaptcha = () => {
    const randomCode = Math.floor(1000 + Math.random() * 9000).toString();
    setCaptchaCode(randomCode);
    setUserCaptchaInput('');
  };

  useEffect(() => {
    generateCaptcha();
    const currentHour = new Date().getHours();
    if ((currentHour >= 7 && currentHour <= 9) || (currentHour >= 17 && currentHour <= 20)) {
      setIsRushHour(true);
    } else {
      setIsRushHour(false);
    }
  }, []);

  // Fetch Supabase Data Pagka-login
  const loadUserDataFromSupabase = async (uId) => {
    try {
      const { data: bData } = await supabase.from('user_budgets').select('budget').eq('user_id', uId).single();
      if (bData) setBudget(parseFloat(bData.budget));

      const { data: hData } = await supabase.from('trip_history').select('*').eq('user_id', uId).order('created_at', { ascending: false });
      if (hData) {
        setHistory(hData.map(item => ({
          id: item.id,
          route: item.route,
          vehicle: item.vehicle,
          amount: parseFloat(item.amount),
          date: new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        })));
      }
    } catch (e) {
      console.log('Error loading Supabase data:', e);
    }
  };

  // Auth Handlers
  const handleLogin = async () => {
    if (!authEmail.trim() || !authPassword.trim()) {
      alert('Please enter your email and password!');
      return;
    }

    if (userCaptchaInput.trim() !== captchaCode) {
      alert('Incorrect CAPTCHA security code! Please try again.');
      generateCaptcha();
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: authEmail.trim(),
        password: authPassword.trim(),
      });

      if (error) {
        alert('Login Failed: ' + error.message);
        generateCaptcha();
      } else {
        const uId = data.user.id;
        const displayName = data.user?.user_metadata?.full_name || authEmail.split('@')[0];
        const savedDiscount = data.user?.user_metadata?.default_discount || 'student';
        
        setUserId(uId);
        setLoggedInUser(displayName);
        setEditName(displayName);
        setDiscountType(savedDiscount);
        
        await loadUserDataFromSupabase(uId);
        setScreen(3);
      }
    } catch (err) {
      alert('Login Error: ' + err.message);
      generateCaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!authName.trim() || !authEmail.trim() || !authPassword.trim()) {
      alert('Please complete all required fields!');
      return;
    }

    if (userCaptchaInput.trim() !== captchaCode) {
      alert('Incorrect CAPTCHA security code! Please try again.');
      generateCaptcha();
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: authEmail.trim(),
        password: authPassword.trim(),
        options: { data: { full_name: authName.trim(), default_discount: 'student' } }
      });

      if (error) {
        alert('Sign Up Failed: ' + error.message);
        generateCaptcha();
      } else {
        alert('Account created successfully!');
        setUserId(data.user?.id);
        setLoggedInUser(authName.trim());
        setEditName(authName.trim());
        setScreen(3);
      }
    } catch (err) {
      alert('Sign Up Error: ' + err.message);
      generateCaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail.trim()) {
      alert('Please enter your email address!');
      return;
    }

    setIsSendingReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim());
      if (error) {
        alert('Error: ' + error.message);
      } else {
        alert('Password reset link sent to your email! Check your inbox.');
        setIsForgotPasswordVisible(false);
        setResetEmail('');
      }
    } catch (err) {
      alert('Reset Error: ' + err.message);
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserId(null);
    setLoggedInUser('');
    setAuthEmail('');
    setAuthPassword('');
    setAuthName('');
    setHistory([]);
    generateCaptcha();
    setScreen(1);
  };

  const handleUpdateProfile = async () => {
    if (!editName.trim()) {
      alert('Full Name cannot be empty!');
      return;
    }

    setIsSavingProfile(true);
    try {
      const updateData = {
        data: { full_name: editName.trim(), default_discount: discountType }
      };

      if (newPassword.trim().length >= 6) {
        updateData.password = newPassword.trim();
      }

      const { data, error } = await supabase.auth.updateUser(updateData);

      if (error) {
        alert('Failed to update profile: ' + error.message);
      } else {
        setLoggedInUser(editName.trim());
        setNewPassword('');
        setIsProfileModalVisible(false);
        alert('Profile updated successfully!');
      }
    } catch (err) {
      alert('Update Error: ' + err.message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleAddBalance = async () => {
    const numAmount = parseFloat(amountToAdd);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Please enter a valid amount!');
      return;
    }
    const newBudget = budget + numAmount;
    setBudget(newBudget);

    if (userId) {
      await supabase.from('user_budgets').upsert({ user_id: userId, budget: newBudget, updated_at: new Date() });
    }

    setAmountToAdd('');
    setIsModalVisible(false);
    alert(`Successfully added ₱${numAmount.toFixed(2)} to your budget!`);
  };

  const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  const generateRouteGuide = (from, to, vType) => {
    let terminalName = `${from} Transport Terminal`;
    if (vType === 'jeep') {
      terminalName = `Olivarez / Central Mall Jeep Terminal`;
    } else if (vType === 'bus') {
      terminalName = `Balibago Complex Bus Terminal / SRIT Station`;
    } else if (vType === 'trike') {
      terminalName = `Barangay TODA Tricycle Terminal at ${from}`;
    }

    return {
      terminalName,
      pickupPoint: `Front Loading Zone at ${from}`,
      signboard: `${to.toUpperCase()} via National Hwy / Expressway`,
      dropoffPoint: `Terminal / Alighting Zone at ${to}`,
      tips: vType === 'jeep'
        ? 'Pass exact fare to driver before alighting.'
        : vType === 'bus'
        ? 'Pay conductor upon entering or riding.'
        : 'Confirm TODA fare rate with driver before riding.'
    };
  };

  const computeFareValue = (dist, vType, discType) => {
    let baseFare = 14.00;

    if (vType === 'jeep') {
      if (dist <= 4) baseFare = 14.00;
      else if (dist > 4 && dist <= 8) baseFare = 20.00;
      else if (dist > 8 && dist <= 16) baseFare = 30.00;
      else baseFare = 30.00 + (dist - 16) * 1.80;
    } else if (vType === 'bus') {
      let extraDist = Math.max(0, dist - 5);
      baseFare = 18.00 + (extraDist * 2.65);
    } else if (vType === 'trike') {
      if (dist <= 4) {
        baseFare = 85.00;
      } else {
        baseFare = 150.00 + (dist - 5) * 15.00;
      }
    }

    let discountMultiplier = (discType === 'student' || discType === 'senior') ? 0.8 : 1.0;
    return baseFare * discountMultiplier;
  };

  const handleSelectVehicle = (selectedType) => {
    setVehicle(selectedType);
    if (distanceKm > 0) {
      setCalculatedFare(computeFareValue(distanceKm, selectedType, discountType));
      setRouteGuide(generateRouteGuide(origin, destination, selectedType));
    }
  };

  const handleQuickRoute = (orig, dest) => {
    setOrigin(orig);
    setDestination(dest);
  };

  const handleCalculateFare = async () => {
    if (!origin.trim() || !destination.trim()) {
      alert('Please enter both Origin and Destination!');
      return;
    }

    setIsSearchingMap(true);
    try {
      const originQuery = `${origin.trim()}, Laguna, Philippines`;
      const destQuery = `${destination.trim()}, Laguna, Philippines`;

      const resOrigin = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(originQuery)}`);
      const dataOrigin = await resOrigin.json();
      const resDest = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destQuery)}`);
      const dataDest = await resDest.json();

      let calcDist = 12;

      if (dataOrigin.length > 0 && dataDest.length > 0) {
        const lat1 = parseFloat(dataOrigin[0].lat), lon1 = parseFloat(dataOrigin[0].lon);
        const lat2 = parseFloat(dataDest[0].lat), lon2 = parseFloat(dataDest[0].lon);

        let rawDist = calculateHaversineDistance(lat1, lon1, lat2, lon2);
        calcDist = Math.min(35, Math.max(1, Math.round(rawDist)));
        
        setMapMarkerUrl(`https://www.openstreetmap.org/export/embed.html?bbox=${Math.min(lon1, lon2)-0.03}%2C${Math.min(lat1, lat2)-0.03}%2C${Math.max(lon1, lon2)+0.03}%2C${Math.max(lat1, lat2)+0.03}&layer=mapnik&marker=${lat1}%2C${lon1}`);
      } else {
        calcDist = Math.max(3, Math.min(20, Math.floor((origin.length + destination.length) * 0.5)));
      }

      setDistanceKm(calcDist);
      setCalculatedFare(computeFareValue(calcDist, vehicle, discountType));
      setRouteGuide(generateRouteGuide(origin, destination, vehicle));
    } catch (err) {
      console.log('Error calculating fare:', err);
    } finally {
      setIsSearchingMap(false);
    }
  };

  const handlePayFare = async () => {
    if (calculatedFare && budget >= calculatedFare) {
      const newBudget = budget - calculatedFare;
      setBudget(newBudget);

      const routeText = `${origin} ➔ ${destination}`;
      const vehText = vehicle.toUpperCase();
      const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (userId) {
        await supabase.from('user_budgets').upsert({ user_id: userId, budget: newBudget, updated_at: new Date() });
        await supabase.from('trip_history').insert([{ user_id: userId, route: routeText, vehicle: vehText, amount: calculatedFare }]);
      }

      const tripData = {
        id: Date.now().toString(),
        route: routeText,
        vehicle: vehText,
        amount: calculatedFare,
        date: timeNow
      };

      setHistory([tripData, ...history]);
      setLastPaidTrip(tripData);
      setIsReceiptModalVisible(true);

      setCalculatedFare(null);
      setRouteGuide(null);
      setOrigin('');
      setDestination('');
    } else {
      alert('Your current budget is not enough.');
    }
  };

  // SCREEN 1: LOGIN
  if (screen === 1) {
    return (
      <LinearGradient colors={['#030712', '#0f172a', '#0284c7']} style={styles.authContainer}>
        <View style={styles.authCard}>
          <Text style={styles.authTitle}>⛽ FareFuel</Text>
          <Text style={styles.authSubtitle}>Commute Smart, Travel Easy</Text>
          <TextInput style={styles.authInput} placeholder="Email Address" placeholderTextColor="#94a3b8" value={authEmail} onChangeText={setAuthEmail} keyboardType="email-address" autoCapitalize="none" />
          <TextInput style={styles.authInput} placeholder="Password" placeholderTextColor="#94a3b8" value={authPassword} onChangeText={setAuthPassword} secureTextEntry />

          {/* CAPTCHA SECTION */}
          <View style={styles.captchaContainer}>
            <View style={styles.captchaDisplayBox}>
              <Text style={styles.captchaText}>{captchaCode}</Text>
              <TouchableOpacity onPress={generateCaptcha} style={styles.refreshCaptchaBtn}>
                <Text style={{ fontSize: 16 }}>🔄</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.captchaInput}
              placeholder="CAPTCHA"
              placeholderTextColor="#94a3b8"
              value={userCaptchaInput}
              onChangeText={setUserCaptchaInput}
              keyboardType="numeric"
              maxLength={4}
            />
          </View>

          <TouchableOpacity style={styles.pillBtnPrimary} onPress={handleLogin} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>LOG IN</Text>}
          </TouchableOpacity>

          {/* FORGOT PASSWORD LINK */}
          <TouchableOpacity onPress={() => { setResetEmail(authEmail); setIsForgotPasswordVisible(true); }} style={{ marginTop: 12 }}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { generateCaptcha(); setScreen(2); }} style={{ marginTop: 12 }}>
            <Text style={styles.switchAuthText}>Don't have an account? <Text style={{ color: '#38bdf8', fontWeight: 'bold' }}>Sign Up now!</Text></Text>
          </TouchableOpacity>
        </View>

        {/* FORGOT PASSWORD MODAL */}
        <Modal visible={isForgotPasswordVisible} transparent animationType="fade" onRequestClose={() => setIsForgotPasswordVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalGlassContent}>
              <Text style={styles.modalTitle}>🔑 Reset Password</Text>
              <Text style={{ color: '#64748b', fontSize: 11, marginBottom: 12 }}>Enter your registered email address and we'll send you a password reset link.</Text>
              <TextInput style={styles.modalInput} placeholder="Email Address" placeholderTextColor="#94a3b8" value={resetEmail} onChangeText={setResetEmail} keyboardType="email-address" autoCapitalize="none" />
              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#cbd5e1' }]} onPress={() => setIsForgotPasswordVisible(false)} disabled={isSendingReset}>
                  <Text style={{ color: '#334155', fontWeight: 'bold' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#0284c7' }]} onPress={handleForgotPassword} disabled={isSendingReset}>
                  {isSendingReset ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontWeight: 'bold' }}>Send Link</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </LinearGradient>
    );
  }

  // SCREEN 2: SIGN UP
  if (screen === 2) {
    return (
      <LinearGradient colors={['#030712', '#0f172a', '#0f766e']} style={styles.authContainer}>
        <View style={styles.authCard}>
          <Text style={styles.authTitle}>📝 Join FareFuel</Text>
          <Text style={styles.authSubtitle}>Create a new account</Text>
          <TextInput style={styles.authInput} placeholder="Full Name" placeholderTextColor="#94a3b8" value={authName} onChangeText={setAuthName} />
          <TextInput style={styles.authInput} placeholder="Email Address" placeholderTextColor="#94a3b8" value={authEmail} onChangeText={setAuthEmail} keyboardType="email-address" autoCapitalize="none" />
          <TextInput style={styles.authInput} placeholder="Password" placeholderTextColor="#94a3b8" value={authPassword} onChangeText={setAuthPassword} secureTextEntry />

          {/* CAPTCHA SECTION */}
          <View style={styles.captchaContainer}>
            <View style={styles.captchaDisplayBox}>
              <Text style={styles.captchaText}>{captchaCode}</Text>
              <TouchableOpacity onPress={generateCaptcha} style={styles.refreshCaptchaBtn}>
                <Text style={{ fontSize: 16 }}>🔄</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.captchaInput}
              placeholder="CAPTCHA"
              placeholderTextColor="#94a3b8"
              value={userCaptchaInput}
              onChangeText={setUserCaptchaInput}
              keyboardType="numeric"
              maxLength={4}
            />
          </View>

          <TouchableOpacity style={styles.pillBtnPrimary} onPress={handleSignUp} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>CREATE ACCOUNT</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { generateCaptcha(); setScreen(1); }} style={{ marginTop: 16 }}>
            <Text style={styles.switchAuthText}>Already have an account? <Text style={{ color: '#38bdf8', fontWeight: 'bold' }}>Log In</Text></Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  // SCREEN 3: DASHBOARD
  return (
    <LinearGradient colors={['#030712', '#0f172a', '#0284c7', '#0f766e']} locations={[0, 0.3, 0.75, 1]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.dashboardContainer} showsVerticalScrollIndicator={false}>

        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.headerTitle}>⛽ FareFuel</Text>
              <View style={styles.onlineStatusBadge}><Text style={{ color: '#4ade80', fontSize: 8, fontWeight: 'bold' }}>● ONLINE</Text></View>
            </View>
            <Text style={{ color: '#94a3b8', fontSize: 10 }}>Commute Dashboard • Laguna</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <TouchableOpacity style={styles.emergencyBtn} onPress={() => setIsEmergencyModalVisible(true)}>
              <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>🚨 SOS</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modernBadge} onPress={() => setIsProfileModalVisible(true)}>
              <Text style={{ color: '#e0f2fe', fontSize: 11, fontWeight: 'bold' }}>⚙️ {loggedInUser}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={{ color: '#f87171', fontSize: 11, fontWeight: 'bold' }}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* RUSH HOUR BANNER */}
        {isRushHour && (
          <View style={styles.rushHourBanner}>
            <Text style={{ color: '#fef08a', fontSize: 10, fontWeight: 'bold' }}>⚠️ Rush Hour Alert: Heavy traffic along National Highway. Expect minor travel delays.</Text>
          </View>
        )}

        {/* BUDGET CARD */}
        <LinearGradient colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.05)']} style={styles.modernBudgetCard}>
          <View>
            <Text style={{ color: '#38bdf8', fontSize: 10, fontWeight: 'bold' }}>REMAINING BUDGET</Text>
            <Text style={{ color: '#fff', fontSize: 28, fontWeight: '800' }}>₱{budget.toFixed(2)}</Text>
          </View>
          <TouchableOpacity style={styles.addBudgetModernBtn} onPress={() => setIsModalVisible(true)}>
            <Text style={styles.addBudgetBtnText}>+ Add Budget</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* DISCOUNT CHIPS */}
        <View style={styles.discountGroup}>
          {[{ id: 'regular', label: 'Regular' }, { id: 'student', label: 'Student (20%)' }, { id: 'senior', label: 'PWD/Senior (20%)' }].map(type => (
            <TouchableOpacity
              key={type.id}
              style={[styles.modernChip, discountType === type.id && styles.modernChipActive]}
              onPress={() => {
                setDiscountType(type.id);
                if (distanceKm > 0) setCalculatedFare(computeFareValue(distanceKm, vehicle, type.id));
              }}
            >
              <Text style={{ fontSize: 10, color: '#fff', fontWeight: 'bold' }}>{type.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* MAP */}
        <View style={styles.mapCard}>
          {isSearchingMap ? (
            <View style={styles.mapLoadingOverlay}>
              <ActivityIndicator size="large" color="#38bdf8" />
              <Text style={{ color: '#fff', fontSize: 11, marginTop: 6 }}>Searching for route...</Text>
            </View>
          ) : Platform.OS === 'web' ? (
            <iframe title="Dynamic Map" width="100%" height="100%" style={{ border: 0, borderRadius: 20 }} loading="lazy" src={mapMarkerUrl || `https://www.openstreetmap.org/export/embed.html?bbox=${mapBbox}&layer=mapnik`} />
          ) : (
            <View style={styles.webMapFallback}><Text style={{ color: '#fff' }}>🗺 Interactive Map View</Text></View>
          )}
        </View>

        {/* PLANNER */}
        <View style={styles.glassPlannerCard}>
          <Text style={{ color: '#f8fafc', fontWeight: 'bold', fontSize: 13, marginBottom: 4 }}>🗺️ Plan Your Trip</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {[
                { o: 'Savemore Biñan', d: 'Balibago Complex' },
                { o: 'Biñan Bayan', d: 'Cabuyao Bayan' },
                { o: 'Santa Rosa Arch', d: 'Calamba City Terminal' }
              ].map((item, idx) => (
                <TouchableOpacity key={idx} style={styles.shortcutChip} onPress={() => handleQuickRoute(item.o, item.d)}>
                  <Text style={{ color: '#e0f2fe', fontSize: 9, fontWeight: '600' }}>⚡ {item.o} ➔ {item.d}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.inputContainer}>
            <Text>📍</Text>
            <TextInput style={styles.floatingInput} placeholder="Origin" placeholderTextColor="#64748b" value={origin} onChangeText={setOrigin} />
          </View>
          <View style={styles.inputContainer}>
            <Text>🏁</Text>
            <TextInput style={styles.floatingInput} placeholder="Destination" placeholderTextColor="#64748b" value={destination} onChangeText={setDestination} />
          </View>
          <TouchableOpacity style={styles.pillBtnPrimary} onPress={handleCalculateFare}>
            <Text style={styles.btnText}>FIND ROUTE & FARE</Text>
          </TouchableOpacity>

          {calculatedFare !== null && (
            <View style={styles.modernFareResult}>
              <View>
                <Text style={{ fontSize: 10, color: '#64748b', fontWeight: '600' }}>EST. DISTANCE: {distanceKm} KM</Text>
                <Text style={{ fontWeight: '800', color: '#0f172a', fontSize: 16 }}>₱{calculatedFare.toFixed(2)}</Text>
              </View>
              <TouchableOpacity style={styles.deductBtn} onPress={handlePayFare}>
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>Deduct Fare</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* TERMINAL SUGGESTIONS GUIDE */}
        {routeGuide && (
          <View style={styles.terminalSuggestCard}>
            <Text style={styles.terminalTitle}>🚏 Recommended Terminal & Route</Text>
            <View style={{ marginBottom: 6 }}>
              <Text style={styles.terminalTag}>SUGGESTED TERMINAL:</Text>
              <Text style={styles.terminalName}>{routeGuide.terminalName}</Text>
            </View>
            <View style={{ marginBottom: 6 }}>
              <Text style={styles.terminalTag}>SIGNBOARD:</Text>
              <Text style={styles.terminalSign}>"{routeGuide.signboard}"</Text>
            </View>
            <View style={styles.tipBox}>
              <Text style={{ color: '#0369a1', fontSize: 10, fontWeight: 'bold' }}>💡 Commute Tip: {routeGuide.tips}</Text>
            </View>
          </View>
        )}

        {/* VEHICLE OPTIONS */}
        <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: 'bold', marginTop: 12, marginBottom: 6 }}>SELECT VEHICLE</Text>
        <View style={styles.vehicleGroup}>
          {[
            { id: 'jeep', label: '🛺 Jeep', rate: '₱14 base' },
            { id: 'trike', label: '🛵 Trike', rate: '₱85-₱150+' },
            { id: 'bus', label: '🚌 Bus', rate: '₱18 base' }
          ].map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.modernVehCard, vehicle === item.id && styles.modernVehCardActive]}
              onPress={() => handleSelectVehicle(item.id)}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>{item.label}</Text>
              <Text style={{ color: vehicle === item.id ? '#e0f2fe' : '#94a3b8', fontSize: 9, marginTop: 2 }}>{item.rate}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* RECENT TRIPS */}
        <View style={styles.historyCardSection}>
          <Text style={styles.historyTitle}>📜 Recent Trips (Saved in Supabase)</Text>
          {history.length === 0 ? (
            <Text style={{ color: '#94a3b8', fontSize: 11, fontStyle: 'italic', textAlign: 'center' }}>No trip history recorded yet.</Text>
          ) : (
            history.slice(0, 5).map(item => (
              <View key={item.id} style={styles.modernHistoryItem}>
                <Text style={{ fontSize: 14 }}>{item.vehicle === 'JEEP' ? '🛺' : item.vehicle === 'TRIKE' ? '🛵' : '🚌'}</Text>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={{ color: '#f8fafc', fontSize: 12, fontWeight: 'bold' }}>{item.route}</Text>
                  <Text style={{ color: '#38bdf8', fontSize: 9 }}>{item.vehicle} • {item.date}</Text>
                </View>
                <Text style={{ color: '#f87171', fontWeight: '800', fontSize: 13 }}>-₱{item.amount.toFixed(2)}</Text>
              </View>
            ))
          )}
        </View>

        {/* ADD BUDGET MODAL */}
        <Modal visible={isModalVisible} transparent animationType="fade" onRequestClose={() => setIsModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalGlassContent}>
              <Text style={styles.modalTitle}>💵 Add Budget</Text>
              <TextInput style={styles.modalInput} placeholder="100" keyboardType="numeric" value={amountToAdd} onChangeText={setAmountToAdd} />
              <View style={styles.quickAddGroup}>
                {[50, 100, 200, 500].map(val => (
                  <TouchableOpacity key={val} style={styles.quickAddBtn} onPress={() => setAmountToAdd(val.toString())}>
                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>+₱{val}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#cbd5e1' }]} onPress={() => setIsModalVisible(false)}>
                  <Text style={{ color: '#334155', fontWeight: 'bold' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#0284c7' }]} onPress={handleAddBalance}>
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* PROFILE SETTINGS MODAL */}
        <Modal visible={isProfileModalVisible} transparent animationType="slide" onRequestClose={() => setIsProfileModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalGlassContent}>
              <Text style={styles.modalTitle}>⚙️ Profile Settings</Text>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <TextInput style={styles.modalInput} placeholder="Your Name" value={editName} onChangeText={setEditName} />
              <Text style={styles.fieldLabel}>New Password (Optional)</Text>
              <TextInput style={styles.modalInput} placeholder="At least 6 characters" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
              <Text style={styles.fieldLabel}>Default Commuter Type</Text>
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 16 }}>
                {[{ id: 'regular', label: 'Regular' }, { id: 'student', label: 'Student' }, { id: 'senior', label: 'Senior/PWD' }].map(t => (
                  <TouchableOpacity key={t.id} style={[styles.smallSettingChip, discountType === t.id && styles.smallSettingChipActive]} onPress={() => setDiscountType(t.id)}>
                    <Text style={{ fontSize: 10, color: discountType === t.id ? '#fff' : '#475569', fontWeight: 'bold' }}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#cbd5e1' }]} onPress={() => setIsProfileModalVisible(false)} disabled={isSavingProfile}>
                  <Text style={{ color: '#334155', fontWeight: 'bold' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#0284c7' }]} onPress={handleUpdateProfile} disabled={isSavingProfile}>
                  {isSavingProfile ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontWeight: 'bold' }}>Save Changes</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* EMERGENCY HOTLINES MODAL */}
        <Modal visible={isEmergencyModalVisible} transparent animationType="slide" onRequestClose={() => setIsEmergencyModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalGlassContent}>
              <Text style={[styles.modalTitle, { color: '#ef4444' }]}>🚨 Laguna Emergency Hotlines</Text>
              <View style={{ gap: 8, marginVertical: 10 }}>
                <View style={styles.emergencyRow}><Text style={styles.emergencyLabel}>Biñan Police Station:</Text><Text style={styles.emergencyNum}>(049) 511-6111</Text></View>
                <View style={styles.emergencyRow}><Text style={styles.emergencyLabel}>Sta. Rosa Traffic Mgmt:</Text><Text style={styles.emergencyNum}>(049) 534-1111</Text></View>
                <View style={styles.emergencyRow}><Text style={styles.emergencyLabel}>Cabuyao Disaster Risk Response:</Text><Text style={styles.emergencyNum}>(049) 531-2111</Text></View>
                <View style={styles.emergencyRow}><Text style={styles.emergencyLabel}>National Emergency Hotline:</Text><Text style={styles.emergencyNum}>911</Text></View>
              </View>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#ef4444', alignSelf: 'flex-end', marginTop: 10 }]} onPress={() => setIsEmergencyModalVisible(false)}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* DIGITAL TRIP RECEIPT MODAL */}
        <Modal visible={isReceiptModalVisible} transparent animationType="fade" onRequestClose={() => setIsReceiptModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalGlassContent, { alignItems: 'center' }]}>
              <Text style={{ fontSize: 32, marginBottom: 4 }}>🧾</Text>
              <Text style={[styles.modalTitle, { textAlign: 'center', marginBottom: 2 }]}>FareFuel Trip Receipt</Text>
              <Text style={{ color: '#64748b', fontSize: 10, marginBottom: 12 }}>Payment Confirmed</Text>
              
              {lastPaidTrip && (
                <View style={styles.receiptBox}>
                  <Text style={styles.receiptText}>Route: <Text style={{ fontWeight: 'bold' }}>{lastPaidTrip.route}</Text></Text>
                  <Text style={styles.receiptText}>Vehicle: <Text style={{ fontWeight: 'bold' }}>{lastPaidTrip.vehicle}</Text></Text>
                  <Text style={styles.receiptText}>Time: <Text style={{ fontWeight: 'bold' }}>{lastPaidTrip.date}</Text></Text>
                  <View style={{ height: 1, backgroundColor: '#cbd5e1', marginVertical: 6 }} />
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#0f766e', textAlign: 'right' }}>Paid: ₱{lastPaidTrip.amount.toFixed(2)}</Text>
                </View>
              )}

              <TouchableOpacity style={[styles.pillBtnPrimary, { marginTop: 14 }]} onPress={() => setIsReceiptModalVisible(false)}>
                <Text style={styles.btnText}>DONE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  authContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  authCard: { backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: 24, borderRadius: 28, width: '100%', maxWidth: 360, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)', alignItems: 'center' },
  authTitle: { fontSize: 26, fontWeight: '900', color: '#fff', marginBottom: 4 },
  authSubtitle: { fontSize: 12, color: '#94a3b8', marginBottom: 20 },
  authInput: { width: '100%', backgroundColor: '#ffffff', borderRadius: 16, paddingHorizontal: 14, height: 44, fontSize: 13, color: '#0f172a', marginBottom: 12 },
  
  // CAPTCHA STYLES
  captchaContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, width: '100%', marginBottom: 12 },
  captchaDisplayBox: { backgroundColor: '#0f172a', borderColor: '#38bdf8', borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
  captchaText: { color: '#38bdf8', fontSize: 18, fontWeight: '900', letterSpacing: 4, fontStyle: 'italic' },
  refreshCaptchaBtn: { padding: 2 },
  captchaInput: { flex: 1, backgroundColor: '#ffffff', borderRadius: 14, paddingHorizontal: 12, height: 44, fontSize: 13, color: '#0f172a' },

  forgotPasswordText: { color: '#38bdf8', fontSize: 11, fontWeight: 'bold' },
  switchAuthText: { color: '#94a3b8', fontSize: 12 },
  logoutBtn: { backgroundColor: 'rgba(239, 68, 68, 0.15)', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' },
  emergencyBtn: { backgroundColor: 'rgba(239, 68, 68, 0.8)', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 12 },
  pillBtnPrimary: { backgroundColor: '#0284c7', paddingVertical: 14, borderRadius: 30, alignItems: 'center', width: '100%' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  dashboardContainer: { paddingTop: 40, paddingBottom: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  headerTitle: { color: '#fff', fontWeight: '900', fontSize: 22 },
  onlineStatusBadge: { backgroundColor: 'rgba(74, 222, 128, 0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(74, 222, 128, 0.3)' },
  rushHourBanner: { backgroundColor: 'rgba(234, 179, 8, 0.2)', padding: 8, borderRadius: 12, borderWidth: 1, borderColor: '#fde047', marginVertical: 6 },
  modernBadge: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  modernBudgetCard: { padding: 18, borderRadius: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  addBudgetModernBtn: { backgroundColor: '#0284c7', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 18 },
  addBudgetBtnText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  discountGroup: { flexDirection: 'row', gap: 8, marginVertical: 10 },
  modernChip: { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', paddingVertical: 8, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  modernChipActive: { backgroundColor: '#0284c7', borderColor: '#38bdf8' },
  mapCard: { height: 180, borderRadius: 24, overflow: 'hidden', backgroundColor: '#0f172a', marginVertical: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  mapLoadingOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(15, 23, 42, 0.8)' },
  webMapFallback: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  glassPlannerCard: { backgroundColor: 'rgba(255,255,255,0.08)', padding: 16, borderRadius: 24, gap: 10, marginVertical: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  shortcutChip: { backgroundColor: 'rgba(56, 189, 248, 0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.4)' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 16, paddingHorizontal: 12, height: 42 },
  floatingInput: { flex: 1, marginLeft: 8, fontSize: 12, color: '#0f172a' },
  modernFareResult: { backgroundColor: '#ffffff', padding: 12, borderRadius: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  deductBtn: { backgroundColor: '#0f766e', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },

  terminalSuggestCard: { backgroundColor: 'rgba(2, 132, 199, 0.18)', padding: 14, borderRadius: 20, marginVertical: 8, borderWidth: 1, borderColor: '#38bdf8' },
  terminalTitle: { color: '#38bdf8', fontSize: 12, fontWeight: 'bold', marginBottom: 8 },
  terminalTag: { color: '#94a3b8', fontSize: 9, fontWeight: 'bold' },
  terminalName: { color: '#ffffff', fontSize: 12, fontWeight: 'bold', marginTop: 2 },
  terminalSign: { color: '#facc15', fontSize: 12, fontWeight: '800', marginTop: 2 },
  tipBox: { backgroundColor: '#e0f2fe', padding: 8, borderRadius: 12, marginTop: 6 },

  vehicleGroup: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  modernVehCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', paddingVertical: 12, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  modernVehCardActive: { backgroundColor: '#0284c7', borderColor: '#38bdf8' },
  historyCardSection: { backgroundColor: 'rgba(0,0,0,0.3)', padding: 16, borderRadius: 24, marginTop: 8 },
  historyTitle: { color: '#fff', fontSize: 13, fontWeight: 'bold', marginBottom: 12 },
  modernHistoryItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', padding: 10, borderRadius: 16, marginBottom: 8 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalGlassContent: { backgroundColor: '#ffffff', width: '100%', maxWidth: 320, padding: 20, borderRadius: 28 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginBottom: 12 },
  modalInput: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 14, padding: 10, fontSize: 13, marginBottom: 10, color: '#0f172a' },
  fieldLabel: { fontSize: 10, fontWeight: 'bold', color: '#64748b', marginBottom: 4 },
  smallSettingChip: { flex: 1, paddingVertical: 8, borderRadius: 12, backgroundColor: '#f1f5f9', alignItems: 'center', borderWidth: 1, borderColor: '#cbd5e1' },
  smallSettingChipActive: { backgroundColor: '#0284c7', borderColor: '#0284c7' },
  quickAddGroup: { flexDirection: 'row', gap: 6, marginBottom: 18 },
  quickAddBtn: { flex: 1, backgroundColor: '#0284c7', paddingVertical: 8, borderRadius: 12, alignItems: 'center' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  modalBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14 },
  
  emergencyRow: { backgroundColor: '#fef2f2', padding: 8, borderRadius: 12 },
  emergencyLabel: { color: '#991b1b', fontSize: 10, fontWeight: 'bold' },
  emergencyNum: { color: '#dc2626', fontSize: 14, fontWeight: '800' },

  receiptBox: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 16, width: '100%', borderWidth: 1, borderColor: '#cbd5e1' },
  receiptText: { color: '#334155', fontSize: 11, marginBottom: 4 }
});
