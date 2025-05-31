import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

interface Message {
  id: string;
  created_at: string;
  read_at: string | null;
  content: string;
  sender: { id: string; full_name: string; avatar_url: string; user_type: string };
  recipient: { id: string; full_name: string; avatar_url: string; user_type: string };
}

interface Conversation {
  participant: { id: string; full_name: string; avatar_url: string; user_type: string };
  messages: Message[];
  lastMessage: Message;
  unreadCount: number;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Handle demo user with mock data
    if (userId === 'demo-user-id') {
      const mockConversations = [
        {
          participant: {
            id: 'creator-1',
            full_name: 'Sarah Lifestyle',
            avatar_url: '',
            user_type: 'creator'
          },
          messages: [
            {
              id: 'msg-1',
              created_at: '2024-01-15T10:30:00Z',
              read_at: null,
              content: 'Hi! I\'m interested in your summer fashion campaign. Could we discuss the details?',
              sender: { id: 'creator-1', full_name: 'Sarah Lifestyle', avatar_url: '', user_type: 'creator' },
              recipient: { id: 'demo-user-id', full_name: 'Demo Brand User', avatar_url: '', user_type: 'brand' }
            }
          ],
          lastMessage: {
            id: 'msg-1',
            created_at: '2024-01-15T10:30:00Z',
            read_at: null,
            content: 'Hi! I\'m interested in your summer fashion campaign. Could we discuss the details?',
            sender: { id: 'creator-1', full_name: 'Sarah Lifestyle', avatar_url: '', user_type: 'creator' },
            recipient: { id: 'demo-user-id', full_name: 'Demo Brand User', avatar_url: '', user_type: 'brand' }
          },
          unreadCount: 1
        }
      ];
      return NextResponse.json(mockConversations);
    }

    // Get all messages where user is sender or recipient
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:users!messages_sender_id_fkey(id, full_name, avatar_url, user_type),
        recipient:users!messages_recipient_id_fkey(id, full_name, avatar_url, user_type),
        collaborations(
          id,
          campaigns(title)
        )
      `)
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Group messages by conversation (other participant)
    const conversationsMap = new Map<string, Conversation>();

    messages?.forEach((message: any) => {
      const otherParticipant = message.sender.id === userId ? message.recipient : message.sender;
      const participantId = otherParticipant.id;

      if (!conversationsMap.has(participantId)) {
        conversationsMap.set(participantId, {
          participant: otherParticipant,
          messages: [],
          lastMessage: message,
          unreadCount: 0
        });
      }

      const conversation = conversationsMap.get(participantId)!;
      conversation.messages.push(message);

      // Update last message if this one is more recent
      if (new Date(message.created_at) > new Date(conversation.lastMessage.created_at)) {
        conversation.lastMessage = message;
      }

      // Count unread messages (messages sent to current user that haven't been read)
      if (message.recipient.id === userId && !message.read_at) {
        conversation.unreadCount++;
      }
    });

    // Sort messages within each conversation
    conversationsMap.forEach(conversation => {
      conversation.messages.sort((a: Message, b: Message) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    });

    // Convert to array and sort by last message time
    const conversations = Array.from(conversationsMap.values()).sort((a: Conversation, b: Conversation) =>
      new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime()
    );

    return NextResponse.json(conversations);

  } catch (error) {
    console.error('Messages API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { recipient_id, content, message_type = 'text', collaboration_id } = await request.json();

    if (!recipient_id || !content) {
      return NextResponse.json(
        { error: 'Recipient ID and content are required' },
        { status: 400 }
      );
    }

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        recipient_id,
        content,
        message_type,
        collaboration_id
      })
      .select(`
        *,
        sender:users!messages_sender_id_fkey(id, full_name, avatar_url, user_type),
        recipient:users!messages_recipient_id_fkey(id, full_name, avatar_url, user_type)
      `)
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(message);

  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
} 