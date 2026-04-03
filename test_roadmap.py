import asyncio
import sys
sys.path.insert(0, 'backend')

from app.services import ai_service

async def test():
    try:
        result = await ai_service.generate_roadmap(
            'Python developer with 3 years experience', 
            'Senior Full Stack Engineer at Google',
            ['React', 'GraphQL', 'System Design']
        )
        print('✅ SUCCESS - Generated roadmap with', len(result['tasks']), 'tasks')
        print('First task:', result['tasks'][0]['task'] if result['tasks'] else 'None')
        print('Duration:', result['duration_weeks'], 'weeks')
        print('Milestones:', result['milestones'])
    except Exception as e:
        print('❌ ERROR:', type(e).__name__, '-', str(e))
        import traceback
        traceback.print_exc()

asyncio.run(test())
