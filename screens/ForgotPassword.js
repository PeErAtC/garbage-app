import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Toast from 'react-native-toast-message';
import { FontAwesome } from '@expo/vector-icons'; // เพิ่มการนำเข้า FontAwesome
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from './api/firebase';

const ForgotPassword = ({ navigation }) => {
  const [idCardNumber, setIdCardNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleVerify = async () => {
    try {
      const q = query(collection(db, "item"), where("idCardNumber", "==", idCardNumber), where("firstName", "==", firstName));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        Toast.show({
          type: 'success',
          text1: 'สำเร็จ',
          text2: 'ข้อมูลถูกต้อง กรุณาตั้งรหัสผ่านใหม่',
        });
        setIsVerified(true); 
      } else {
        Toast.show({
          type: 'error',
          text1: 'ไม่พบข้อมูล',
          text2: 'ไม่พบผู้ใช้ที่มีข้อมูลตรงกัน',
        });
      }
    } catch (error) {
      console.error("Error verifying user: ", error);
      Toast.show({
        type: 'error',
        text1: 'ข้อผิดพลาด',
        text2: 'เกิดข้อผิดพลาดขณะตรวจสอบข้อมูล',
      });
    }
  };

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'ข้อผิดพลาด',
        text2: 'รหัสผ่านใหม่ไม่ตรงกัน',
      });
      return;
    }

    try {
      const q = query(collection(db, "item"), where("idCardNumber", "==", idCardNumber), where("firstName", "==", firstName));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userRef = doc(db, "item", userDoc.id);

        await updateDoc(userRef, {
          password: newPassword
        });

        Toast.show({
          type: 'success',
          text1: 'สำเร็จ',
          text2: 'รีเซ็ตรหัสผ่านสำเร็จ',
        });

        navigation.navigate('Login');

      } else {
        Toast.show({
          type: 'error',
          text1: 'ไม่พบข้อมูล',
          text2: 'ไม่พบผู้ใช้ที่มีข้อมูลตรงกัน',
        });
      }
    } catch (error) {
      console.error("Error resetting password: ", error);
      Toast.show({
        type: 'error',
        text1: 'ข้อผิดพลาด',
        text2: 'เกิดข้อผิดพลาดขณะรีเซ็ตรหัสผ่าน',
      });
    }
  };

  const handlePasswordChange = (text, setPassword) => {
    const numericText = text.replace(/[^0-9]/g, ''); 
    setPassword(numericText);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ลืมรหัสผ่าน</Text>

      {!isVerified ? (
        <>
          {/* Input field for ID card number */}
          <View style={styles.inputContainer}>
            <FontAwesome name="id-card" size={20} color="#333" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="เลขบัตรประจำตัวประชาชน"
              value={idCardNumber}
              onChangeText={setIdCardNumber}
              keyboardType="numeric"
              maxLength={13}
            />
          </View>

          {/* Input field for first name */}
          <View style={styles.inputContainer}>
            <FontAwesome name="user" size={20} color="#333" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="ชื่อ"
              value={firstName}
              onChangeText={setFirstName}
            />
          </View>

          {/* Verify button */}
          <TouchableOpacity onPress={handleVerify} style={styles.button}>
            <FontAwesome name="check" size={20} color="#fff" style={styles.icon} />
            <Text style={styles.buttonText}>ยืนยันข้อมูล</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.instruction}>กรุณาตั้งรหัสผ่านใหม่ 4 ตัวเลข</Text>

          {/* New password field */}
          <View style={styles.passwordContainer}>
            <FontAwesome name="lock" size={20} color="#333" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="รหัสผ่านใหม่"
              value={newPassword}
              onChangeText={(text) => handlePasswordChange(text, setNewPassword)} 
              secureTextEntry={!showPassword}
              keyboardType="numeric"
              maxLength={4}
            />
            <TouchableOpacity 
              onPress={() => setShowPassword(!showPassword)} 
              style={styles.toggleButton}>
              <Text style={styles.toggleText}>{showPassword ? "ซ่อน" : "แสดง"}</Text>
            </TouchableOpacity>
          </View>

          {/* Confirm new password field */}
          <View style={styles.passwordContainer}>
            <FontAwesome name="lock" size={20} color="#333" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="ยืนยันรหัสผ่านใหม่"
              value={confirmPassword}
              onChangeText={(text) => handlePasswordChange(text, setConfirmPassword)}
              secureTextEntry={!showConfirmPassword}
              keyboardType="numeric"
              maxLength={4}
            />
            <TouchableOpacity 
              onPress={() => setShowConfirmPassword(!showConfirmPassword)} 
              style={styles.toggleButton}>
              <Text style={styles.toggleText}>{showConfirmPassword ? "ซ่อน" : "แสดง"}</Text>
            </TouchableOpacity>
          </View>

          {/* Reset password button */}
          <TouchableOpacity onPress={handleResetPassword} style={styles.button}>
            <FontAwesome name="check" size={20} color="#fff" style={styles.icon} />
            <Text style={styles.buttonText}>รีเซ็ตรหัสผ่าน</Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.login}>กลับไปหน้าล็อกอิน</Text>
      </TouchableOpacity>
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
  },
  title: {
    fontSize: 32,
    marginBottom: 16,
  },
  instruction: {
    fontSize: 16,
    color: 'red',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 12,
    marginVertical: 10, // เพิ่มระยะห่างระหว่างฟิลด์
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
    width: '100%',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 12,
    marginVertical: 10, // เพิ่มระยะห่างระหว่างฟิลด์
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
    width: '100%',
  },
  toggleButton: {
    position: 'absolute',
    right: 16,
  },
  toggleText: {
    color: '#007bff',
    fontSize: 16,
  },
  button: {
    width: '100%',
    padding: 16,
    backgroundColor: '#007bff',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  login: {
    color: '#007bff',
  },
  icon: {
    marginRight: 10,
  },
});

export default ForgotPassword;