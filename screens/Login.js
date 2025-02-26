import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage'; // นำเข้า AsyncStorage
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from './api/firebase';

const Login = ({ navigation }) => {
  const [idCardNumber, setIdCardNumber] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false); // เพิ่ม state สำหรับจำรหัสผ่าน

  const handleLogin = async () => {
    try {
      console.log("Login attempt with ID:", idCardNumber, "and Password:", password);

      const q = query(collection(db, "item"), where("idCardNumber", "==", idCardNumber), where("password", "==", password));
      const querySnapshot = await getDocs(q);

      console.log("Query snapshot size:", querySnapshot.size);
      querySnapshot.forEach((doc) => {
        console.log(doc.id, " => ", doc.data());
      });

      if (!querySnapshot.empty) {
        const user = querySnapshot.docs[0].data();
        console.log('User signed in!', user);

        // จำรหัสผ่านถ้าเลือก Remember Me
        if (rememberMe) {
          await AsyncStorage.setItem('idCardNumber', idCardNumber);
          await AsyncStorage.setItem('password', password);
        } else {
          await AsyncStorage.removeItem('idCardNumber');
          await AsyncStorage.removeItem('password');
        }

        // แสดง Toast แจ้งเตือนเมื่อเข้าสู่ระบบสำเร็จ
        Toast.show({
          type: 'success',
          text1: 'สำเร็จ',
          text2: 'เข้าสู่ระบบสำเร็จ',
          visibilityTime: 2000, // กำหนดเวลาในการแสดง Toast (ในมิลลิวินาที)
        });

        navigation.navigate('Main', { user });

      } else {
        console.log('Invalid ID or password');
        Toast.show({
          type: 'error',
          text1: 'ข้อผิดพลาด',
          text2: 'เลขบัตรประชาชนหรือรหัสผ่านไม่ถูกต้อง',
          visibilityTime: 2000,
        });
      }
    } catch (error) {
      console.error("Error signing in: ", error);
      Toast.show({
        type: 'error',
        text1: 'ข้อผิดพลาด',
        text2: 'เกิดข้อผิดพลาดขณะเข้าสู่ระบบ',
        visibilityTime: 2000,
      });
    }
  };

  const handleRememberMe = () => {
    setRememberMe(!rememberMe);
  };

  // ฟังก์ชันสำหรับตรวจสอบให้ใส่ได้เฉพาะตัวเลขเท่านั้น
  const handleIdCardChange = (text) => {
    const numericText = text.replace(/[^0-9]/g, ''); // ลบตัวอักษรที่ไม่ใช่ตัวเลข
    setIdCardNumber(numericText);
  };

  const handlePasswordChange = (text) => {
    const numericText = text.replace(/[^0-9]/g, ''); // ลบตัวอักษรที่ไม่ใช่ตัวเลข
    setPassword(numericText);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Log In</Text>
      
      <Image
        source={require('../assets/images/login.png')} // ปรับเส้นทางตามโครงสร้างที่คุณมี
        style={styles.logo}
      />
      
      <TextInput
        style={styles.input}
        placeholder="เลขบัตรประจำตัวประชาชน"
        value={idCardNumber}
        onChangeText={handleIdCardChange} // ใช้ฟังก์ชันที่กำหนดให้ใส่ได้เฉพาะตัวเลข
        keyboardType="numeric"
        maxLength={13}  // ล็อคจำนวนตัวเลขที่สามารถใส่ได้สูงสุด 13 ตัว
      />
      <TextInput
        style={styles.input}
        placeholder="รหัสผ่าน"
        value={password}
        onChangeText={handlePasswordChange} // ใช้ฟังก์ชันที่กำหนดให้ใส่ได้เฉพาะตัวเลข
        keyboardType="numeric"
        maxLength={4} // ล็อคจำนวนตัวเลขที่สามารถใส่ได้สูงสุด 4 ตัว
        secureTextEntry
      />

      <View style={styles.optionsContainer}>
        <TouchableOpacity onPress={handleRememberMe} style={styles.rememberMeContainer}>
          <View style={[styles.checkbox, rememberMe && styles.checked]} />
          <Text style={styles.rememberMeText}>จำรหัสผ่าน</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.forgotPassword}>ลืมรหัสผ่าน?</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={handleLogin} style={styles.button}>
        <Text style={styles.buttonText}>เข้าสู่ระบบ</Text>
      </TouchableOpacity>

      <View style={styles.signupContainer}>
        <Text style={styles.noAccountText}>หากยังไม่มีบัญชี? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
          <Text style={styles.signupText}>สมัครสมาชิก</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 30,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff', 
  },
  title: {
    fontSize: 40,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  logo: {
    width: 220,
    height: 220,
    marginBottom: 20,
  },
  input: {
    width: '90%',
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 40,
    backgroundColor: '#fff',
    textAlign: 'center',
    textAlignVertical: 'center', 
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    marginBottom: 40,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 5,
    marginRight: 10,
  },
  checked: {
    backgroundColor: '#007bff',
  },
  rememberMeText: {
    color: '#000',
  },
  forgotPassword: {
    color: '#007bff',
  },
  button: {
    width: '55%',
    padding: 14,
    backgroundColor: '#007bff',
    borderRadius: 40,
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signupContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  noAccountText: {
    color: '#000',
    fontSize: 14,
  },
  signupText: {
    color: '#007bff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default Login;