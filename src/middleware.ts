import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run code that requires a user on the /login route, or API callbacks
  if (
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/auth') ||
    request.nextUrl.pathname.startsWith('/api/extract-problem') ||
    request.nextUrl.pathname.startsWith('/_next')
  ) {
    return supabaseResponse
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If user is not logged in, redirect them to the login page
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirect logic for Setup API Key page
  const isSetupKeyPage = request.nextUrl.pathname.startsWith('/setup-key')
  const isKeyApi = request.nextUrl.pathname.startsWith('/api/user/key')

  if (!isSetupKeyPage && !isKeyApi) {
    try {
      // Check if user has an API key in the database
      // Fetch via standard postgrest client
      const { data } = await supabase
        .from('user_keys')
        .select('encrypted_key')
        .eq('user_id', user.id)
        .single()

      if (!data?.encrypted_key) {
        const url = request.nextUrl.clone()
        url.pathname = '/setup-key'
        return NextResponse.redirect(url)
      }
    } catch (e) {
      console.error("Middleware DB check error:", e)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
