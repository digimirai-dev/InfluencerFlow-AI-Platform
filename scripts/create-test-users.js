import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pmegrknwfnntlosiwfcp.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const testUsers = [
  {
    email: 'admin@influencerflow.com',
    password: 'admin123',
    user_type: 'admin',
    full_name: 'Admin User'
  },
  {
    email: 'brand@influencerflow.com',
    password: 'brand123',
    user_type: 'brand',
    full_name: 'Brand Manager'
  },
  {
    email: 'creator@influencerflow.com',
    password: 'creator123',
    user_type: 'creator',
    full_name: 'Content Creator'
  }
]

async function createTestUsers() {
  console.log('🚀 Creating test users...')
  
  for (const userData of testUsers) {
    try {
      console.log(`Creating user: ${userData.email}`)
      
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          full_name: userData.full_name,
          user_type: userData.user_type
        }
      })

      if (authError) {
        console.error(`❌ Error creating auth user ${userData.email}:`, authError.message)
        continue
      }

      console.log(`✅ Auth user created: ${userData.email}`)

      // Create profile in users table
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: userData.email,
          full_name: userData.full_name,
          user_type: userData.user_type
        })

      if (profileError) {
        console.error(`❌ Error creating profile for ${userData.email}:`, profileError.message)
      } else {
        console.log(`✅ Profile created: ${userData.email}`)
      }

    } catch (error) {
      console.error(`💥 Unexpected error for ${userData.email}:`, error)
    }
  }
  
  console.log('🎉 Test user creation completed!')
}

createTestUsers().catch(console.error) 