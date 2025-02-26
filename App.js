import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Login from './screens/Login';
import Main from './screens/Main';
import Signup from './screens/Signup';
import ForgotPassword from './screens/ForgotPassword';
import Toast from 'react-native-toast-message';
import ProfileScreen from './screens/ProfileScreen';
import TransferScreen from './screens/TransferScreen';
import PaymentScreen from './screens/PaymentScreen';
import ReportScreen from './screens/ReportScreen';

const Stack = createStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
        <Stack.Screen name="Main" component={Main} options={{ headerShown: false }}/>
        <Stack.Screen name="Signup" component={Signup} options={{ headerShown: false }}/>
        <Stack.Screen name="ForgotPassword" component={ForgotPassword} options={{ headerShown: false }}/>
        <Stack.Screen name="ProfileScreen" component={ProfileScreen} options={{ headerShown: false }}/>
        <Stack.Screen name="TransferScreen" component={TransferScreen} options={{ headerShown: false }}/>
        <Stack.Screen name="PaymentScreen" component={PaymentScreen} options={{ headerShown: false }}/>
        <Stack.Screen name="ReportScreen" component={ReportScreen} options={{ headerShown: false }}/>
      </Stack.Navigator>
      <Toast ref={(ref) => Toast.setRef(ref)} />
    </NavigationContainer>
  );
}

export default App;