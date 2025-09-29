export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const idPhoto = formData.get('idPhoto');
    const email = formData.get('email');
    
    if (!idPhoto || !email) {
      return new Response(JSON.stringify({ errors: ['ID photo and email required'] }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // For demo, accept any image file
    if (idPhoto.size > 0 && idPhoto.type.startsWith('image/')) {
      console.log(`ID verified for ${email}, file: ${idPhoto.name}`);
      return new Response(JSON.stringify({ success: true }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ errors: ['Invalid ID photo'] }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Verify ID error:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
