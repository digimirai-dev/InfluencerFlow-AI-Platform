import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (!user || authError) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.log('🔧 Applying AI Workflow Schema for user:', user.email)

    // Read the SQL file
    const sqlPath = path.join(process.cwd(), 'scripts', 'apply-ai-workflow.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')

    // Split SQL into individual statements (rough approach)
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    const results = []
    let successCount = 0
    let errorCount = 0

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      
      try {
        console.log(`📡 Executing statement ${i + 1}/${statements.length}`)
        
        const { data, error } = await supabase.rpc('execute_sql', {
          sql_query: statement
        })

        if (error) {
          console.log(`⚠️ Error in statement ${i + 1}:`, error.message)
          results.push({
            statement: i + 1,
            status: 'error',
            error: error.message,
            sql: statement.substring(0, 100) + '...'
          })
          errorCount++
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`)
          results.push({
            statement: i + 1,
            status: 'success',
            sql: statement.substring(0, 100) + '...'
          })
          successCount++
        }
      } catch (err) {
        console.log(`💥 Exception in statement ${i + 1}:`, err)
        results.push({
          statement: i + 1,
          status: 'exception',
          error: err instanceof Error ? err.message : 'Unknown error',
          sql: statement.substring(0, 100) + '...'
        })
        errorCount++
      }
    }

    // Try direct table creation if RPC doesn't work
    if (errorCount > 0) {
      console.log('🔄 RPC method had errors, trying direct table creation...')
      
      try {
        // Try creating just the creator_recommendations table directly
        const { data: testData, error: testError } = await supabase
          .from('creator_recommendations')
          .select('*')
          .limit(1)
        
        if (testError && testError.code === '42P01') {
          // Table doesn't exist, this is expected
          console.log('✅ Confirmed AI workflow tables need to be created')
        } else {
          console.log('✅ AI workflow tables may already exist')
        }
      } catch (directError) {
        console.log('⚠️ Direct table check failed:', directError)
      }
    }

    const summary = {
      total_statements: statements.length,
      successful: successCount,
      errors: errorCount,
      completion_rate: `${Math.round((successCount / statements.length) * 100)}%`
    }

    console.log('🎯 AI Workflow Setup Summary:', summary)

    return NextResponse.json({
      success: errorCount === 0,
      message: errorCount === 0 
        ? 'AI workflow schema applied successfully!' 
        : `AI workflow schema partially applied. ${successCount} success, ${errorCount} errors.`,
      summary,
      results: results.slice(0, 10), // Return first 10 results
      recommendation: errorCount > 0 
        ? 'Some tables may already exist or require manual setup in Supabase dashboard.'
        : 'All AI workflow tables are ready for use!'
    })

  } catch (error) {
    console.error('💥 Error applying AI workflow schema:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to apply AI workflow schema',
        details: error instanceof Error ? error.message : 'Unknown error',
        recommendation: 'Try applying the schema manually in Supabase SQL editor'
      },
      { status: 500 }
    )
  }
} 