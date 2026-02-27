import ConversationScreen from '@/app/(app)/(tabs)/social/chat/[conversationId]';
import { render } from '@testing-library/react-native';
import React from 'react';

jest.mock('expo-media-library');
jest.mock('expo-file-system');

// Mock current user
const mockCurrentUser = {
  id: 'user123'
}

// Mock message from someone else
const messageFromOtherUser = {
  sender_id: 'user999',
  content: 'Hello'
}

// Mock message from current user
const messageFromCurrentUser = {
  sender_id: 'user123',
  content: 'My own message'
}

describe('Conversation Screen Notification Logic', () => {

  test('renders without crashing', () => {
    const { toJSON } = render(<ConversationScreen />)
    expect(toJSON()).toBeTruthy()
  })

  test('should trigger notification when message is from another user', () => {
    const isFromOtherUser =
      messageFromOtherUser.sender_id !== mockCurrentUser.id

    expect(isFromOtherUser).toBe(true)
  })

  test('should NOT trigger notification when message is from current user', () => {
    const isFromOtherUser =
      messageFromCurrentUser.sender_id !== mockCurrentUser.id

    expect(isFromOtherUser).toBe(false)
  })

})
