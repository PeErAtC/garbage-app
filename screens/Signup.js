import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker'; 
import { FontAwesome } from '@expo/vector-icons';
import { collection, addDoc, doc, updateDoc } from "firebase/firestore";
import { db } from './api/firebase';
import Toast from 'react-native-toast-message'; // Import Toast

const Signup = ({ navigation }) => {
  const [prefix, setPrefix] = useState('นาย');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [idCardNumber, setIdCardNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [moo, setMoo] = useState('');
  const [subDistrict, setSubDistrict] = useState('ศรีสองรัก');
  const [district, setDistrict] = useState('เมือง');
  const [province, setProvince] = useState('เลย');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [location, setLocation] = useState('');

  const [errors, setErrors] = useState({
    firstName: false,
    lastName: false,
    idCardNumber: false,
    phoneNumber: false,
    houseNumber: false,
    moo: false,
    subDistrict: false,
    district: false,
    province: false,
    password: false,
    confirmPassword: false,
    location: false,
  });

  const handleSignup = async () => {
    let valid = true;
    let newErrors = { ...errors };

    Object.keys(newErrors).forEach(key => {
      newErrors[key] = false;
    });

    if (firstName.trim() === '') {
      newErrors.firstName = true;
      valid = false;
    }
    if (lastName.trim() === '') {
      newErrors.lastName = true;
      valid = false;
    }
    if (idCardNumber.trim() === '' || idCardNumber.length !== 13) {
      Toast.show({
        type: 'error',
        text1: 'ข้อผิดพลาด',
        text2: 'เลขบัตรประชาชนต้องมี 13 หลัก',
      });
      newErrors.idCardNumber = true;
      valid = false;
    }
    if (phoneNumber.trim() === '' || phoneNumber.length !== 10) {
      Toast.show({
        type: 'error',
        text1: 'ข้อผิดพลาด',
        text2: 'เบอร์โทรศัพท์ต้องมี 10 หลัก',
      });
      newErrors.phoneNumber = true;
      valid = false;
    }
    if (password.trim() === '' || password.length !== 4) {
      Toast.show({
        type: 'error',
        text1: 'ข้อผิดพลาด',
        text2: 'รหัสผ่านต้องมี 4 หลัก',
      });
      newErrors.password = true;
      valid = false;
    }
    if (confirmPassword.trim() === '' || password !== confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'ข้อผิดพลาด',
        text2: 'กรุณากรอกข้อมูลให้ครบทุกช่อง',
      });
      newErrors.confirmPassword = true;
      valid = false;
    }
    if (location.trim() === '') {
      newErrors.location = true;
      valid = false;
    }

    if (!valid) {
      setErrors(newErrors);
      return;
    }

    // แสดง Toast เพื่อยืนยันการสมัคร
    Toast.show({
      type: 'info',
      text1: 'ยืนยันการสมัครสมาชิก',
      text2: 'คุณต้องการสมัครสมาชิกใช่หรือไม่?',
    });

    // การสมัครสมาชิกที่เกิดขึ้นหลังการยืนยัน
    try {
      const docRef = await addDoc(collection(db, "item"), {
        prefix,
        firstName,
        lastName,
        idCardNumber,
        phoneNumber,
        houseNumber,
        moo,
        subDistrict,
        district,
        province,
        password,
        location
      });
      
      // อัปเดตฟิลด์ 'id' ในเอกสารที่สร้างขึ้นใหม่
      await updateDoc(doc(db, "item", docRef.id), {
        id: docRef.id
      });

      console.log("Document written with ID: ", docRef.id);

      Toast.show({
        type: 'success',
        text1: 'สำเร็จ',
        text2: 'สมัครสมาชิกเรียบร้อยแล้ว',
      });

      navigation.navigate('Login');
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'ข้อผิดพลาด',
        text2: 'เกิดข้อผิดพลาดในการสมัครสมาชิก',
      });
      console.error("Error adding document: ", e);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>สมัครสมาชิก</Text>
      
      <View style={styles.inputContainer}>
        <FontAwesome name="user" size={20} color="#333" style={styles.icon} />
        <Picker
          selectedValue={prefix}
          style={styles.picker}
          onValueChange={(itemValue) => setPrefix(itemValue)}
        >
          <Picker.Item label="นาย" value="นาย" />
          <Picker.Item label="นางสาว" value="นางสาว" />
          <Picker.Item label="นาง" value="นาง" />
        </Picker>
      </View>
      
      <View style={styles.inputContainer}>
        <FontAwesome name="user" size={20} color="#333" style={styles.icon} />
        <TextInput
          style={[styles.input, errors.firstName && styles.errorBorder]}
          placeholder="ชื่อ"
          value={firstName}
          onChangeText={setFirstName}
        />
      </View>

      <View style={styles.inputContainer}>
        <FontAwesome name="user" size={20} color="#333" style={styles.icon} />
        <TextInput
          style={[styles.input, errors.lastName && styles.errorBorder]}
          placeholder="นามสกุล"
          value={lastName}
          onChangeText={setLastName}
        />
      </View>

      <View style={styles.inputContainer}>
        <FontAwesome name="id-card" size={20} color="#333" style={styles.icon} />
        <TextInput
          style={[styles.input, errors.idCardNumber && styles.errorBorder]}
          placeholder="เลขบัตรประจำตัวประชาชน"
          value={idCardNumber}
          onChangeText={setIdCardNumber}
          keyboardType="numeric"
          maxLength={13}
        />
      </View>

      <View style={styles.inputContainer}>
        <FontAwesome name="phone" size={20} color="#333" style={styles.icon} />
        <TextInput
          style={[styles.input, errors.phoneNumber && styles.errorBorder]}
          placeholder="เบอร์โทรศัพท์"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
          maxLength={10}
        />
      </View>

      <View style={styles.inputContainer}>
        <FontAwesome name="home" size={20} color="#333" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="บ้านเลขที่"
          value={houseNumber}
          onChangeText={setHouseNumber}
        />
      </View>

      <View style={styles.inputContainer}>
        <FontAwesome name="map-marker" size={20} color="#333" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="หมู่ที่"
          value={moo}
          onChangeText={setMoo}
        />
      </View>

      {/* Picker for ตำบล */}
      <View style={styles.inputContainer}>
        <FontAwesome name="map-marker" size={20} color="#333" style={styles.icon} />
        <Picker
          selectedValue={subDistrict}
          style={styles.picker}
          onValueChange={(itemValue) => setSubDistrict(itemValue)}
        >
          <Picker.Item label="ศรีสองรัก" value="ศรีสองรัก" />
        </Picker>
      </View>

      {/* Picker for อำเภอ */}
      <View style={styles.inputContainer}>
        <FontAwesome name="map-marker" size={20} color="#333" style={styles.icon} />
        <Picker
          selectedValue={district}
          style={styles.picker}
          onValueChange={(itemValue) => setDistrict(itemValue)}
        >
          <Picker.Item label="เมือง" value="เมือง" />
        </Picker>
      </View>

      {/* Picker for จังหวัด */}
      <View style={styles.inputContainer}>
        <FontAwesome name="map-marker" size={20} color="#333" style={styles.icon} />
        <Picker
          selectedValue={province}
          style={styles.picker}
          onValueChange={(itemValue) => setProvince(itemValue)}
        >
          <Picker.Item label="เลย" value="เลย" />
        </Picker>
      </View>

      <View style={styles.inputContainer}>
        <FontAwesome name="lock" size={20} color="#333" style={styles.icon} />
        <TextInput
          style={[styles.input, errors.password && styles.errorBorder]}
          placeholder="รหัสผ่าน"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          keyboardType="numeric"
          maxLength={4}
        />
      </View>

      <View style={styles.inputContainer}>
        <FontAwesome name="lock" size={20} color="#333" style={styles.icon} />
        <TextInput
          style={[styles.input, errors.confirmPassword && styles.errorBorder]}
          placeholder="ยืนยันรหัสผ่าน"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          keyboardType="numeric"
          maxLength={4}
        />
      </View>

      <View style={styles.inputContainer}>
        <FontAwesome name="map" size={20} color="#333" style={styles.icon} />
        <TextInput
          style={[styles.input, errors.location && styles.errorBorder]}
          placeholder="location"
          value={location}
          onChangeText={setLocation}
        />
      </View>

      <TouchableOpacity onPress={handleSignup} style={styles.button}>
        <FontAwesome name="check" size={20} color="#fff" style={styles.icon} />
        <Text style={styles.buttonText}>สมัครสมาชิก</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.loginLink}>มีสมาชิกอยู่แล้ว? เข้าสู่ระบบ</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 30,
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 32,
    marginBottom: 16,
  },  
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 12,
    marginBottom: 6,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
  },
  picker: {
    flex: 1,
    height: 50,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  icon: {
    marginRight: 10,
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
  loginLink: {
    color: '#007bff',
  },
  errorBorder: {
    borderColor: 'red',
  },
});

export default Signup;
