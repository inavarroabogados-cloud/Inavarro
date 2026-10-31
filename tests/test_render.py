import contextlib
import importlib.util
import io
from pathlib import Path
import unittest
from unittest.mock import patch, Mock

spec=importlib.util.spec_from_file_location('render',Path(__file__).resolve().parents[1]/'ops/render.py')
r=importlib.util.module_from_spec(spec);spec.loader.exec_module(r)

SERVICE={'id':'srv-test','name':'inavarro-abogados','repo':r.CONFIG['expected_repository'],
         'branch':'main','type':'static_site','rootDir':'','ownerId':'tea-test',
         'serviceDetails':{'url':r.CONFIG['public_origin'],'buildCommand':'node deploy.mjs','publishPath':'dist'}}
SHA='a'*40
class Releases(unittest.TestCase):
 def test_missing_secret_stops_before_any_network(self):
  with patch.dict(r.os.environ,{},clear=True),patch.object(r.urllib.request,'build_opener') as opener:
   with self.assertRaisesRegex(r.ReleaseError,'Falta RENDER_API_KEY'):r.Render()
   opener.assert_not_called()
 def test_valid_static_configuration(self):
  self.assertEqual(r.validate_service(SERVICE)['branch'],'main')
 def test_wrong_repo_branch_type_or_publish_path_block(self):
  for field,value in [('repo','https://github.com/other/repo'),('branch','other'),('type','web_service')]:
   with self.subTest(field=field),self.assertRaises(r.ReleaseError):r.validate_service({**SERVICE,field:value})
  with self.assertRaises(r.ReleaseError):r.validate_service({**SERVICE,'serviceDetails':{**SERVICE['serviceDetails'],'publishPath':'other'}})
 def test_exact_name_service_discovery(self):
  api=object.__new__(r.Render);api.request=Mock(side_effect=[[{'service':{'name':'inavarro-abogados','id':'srv-test'}}],SERVICE])
  with patch.dict(r.os.environ,{},clear=True):self.assertEqual(api.service(),SERVICE)
 def test_ambiguous_service_is_not_selected(self):
  api=object.__new__(r.Render);api.request=Mock(return_value=[{'service':SERVICE},{'service':SERVICE}])
  with patch.dict(r.os.environ,{},clear=True),self.assertRaises(r.ReleaseError):api.service()
 def test_live_requires_matching_commit(self):
  api=Mock();api.request.return_value={'status':'live','commit':{'id':'b'*40}}
  with self.assertRaisesRegex(r.ReleaseError,'otro commit'):r.monitor(api,SERVICE,'dep-test',SHA)
 def test_failed_deploy_never_runs_public_verification(self):
  api=Mock();api.request.return_value={'status':'build_failed'}
  with patch.object(r,'build_logs') as logs,patch.object(r,'public_checks') as public:
   with self.assertRaisesRegex(r.ReleaseError,'fallado'):r.monitor(api,SERVICE,'dep-test',SHA)
   logs.assert_called_once();public.assert_not_called()
 def test_live_only_succeeds_after_logs_web_and_same_latest_deploy(self):
  api=Mock();api.request.side_effect=[{'status':'live','commit':{'id':SHA}},[{'deploy':{'id':'dep-test','status':'live','commit':{'id':SHA}}}]]
  out=io.StringIO()
  with patch.object(r,'build_logs') as logs,patch.object(r,'public_checks') as public,contextlib.redirect_stdout(out):
   r.monitor(api,SERVICE,'dep-test',SHA)
   logs.assert_called_once();public.assert_called_once_with(SHA,False)
  self.assertIn('PUBLICACIÓN VERIFICADA',out.getvalue())
 def test_public_404_blocks_success(self):
  api=Mock();api.request.return_value={'status':'live','commit':{'id':SHA}}
  with patch.object(r,'build_logs'),patch.object(r,'public_checks',side_effect=r.ReleaseError('HTTP 404')),self.assertRaises(r.ReleaseError):r.monitor(api,SERVICE,'dep-test',SHA)
 def test_logs_paginate_and_never_print_messages(self):
  api=Mock();api.request.side_effect=[{'logs':[{'id':'1','message':'confidential build output','labels':[]}],'hasMore':True,'nextStartTime':'next','nextEndTime':'end'}, {'logs':[{'id':'2','message':'second','labels':[]}],'hasMore':False}]
  out=io.StringIO()
  with contextlib.redirect_stdout(out):self.assertEqual(r.build_logs(api,SERVICE,{'createdAt':'start','finishedAt':'finish'}),2)
  self.assertNotIn('confidential',out.getvalue());self.assertEqual(api.request.call_count,2)
 def test_empty_logs_do_not_count_as_review(self):
  api=Mock();api.request.return_value={'logs':[],'hasMore':False}
  with self.assertRaisesRegex(r.ReleaseError,'Sin registros'):r.build_logs(api,SERVICE,{'createdAt':'start'})
 def test_timeout_has_no_success_and_no_repeat_post(self):
  api=Mock()
  with self.assertRaisesRegex(r.ReleaseError,'Tiempo agotado'):r.monitor(api,SERVICE,'dep-test',SHA,timeout=0)
  api.request.assert_not_called()
 def test_a_newer_deploy_blocks_claim(self):
  api=Mock();api.request.side_effect=[{'status':'live','commit':{'id':SHA}},[{'deploy':{'id':'dep-other'}}]]
  with patch.object(r,'build_logs'),patch.object(r,'public_checks'),self.assertRaisesRegex(r.ReleaseError,'Otro despliegue'):r.monitor(api,SERVICE,'dep-test',SHA)

class PublicationControl(unittest.TestCase):
 def invoke(self, latest):
  api=Mock();api.service.return_value=SERVICE;api.request.return_value=latest
  with patch.object(r,'Render',return_value=api),patch.object(r,'git_commit',return_value=SHA),patch.object(r,'monitor') as monitor,patch.object(r.sys,'argv',['render.py','deploy','--commit',SHA]):
   r.main()
  return api,monitor
 def test_existing_same_commit_is_reused_without_post(self):
  api,monitor=self.invoke([{'deploy':{'id':'dep-test','status':'build_in_progress','commit':{'id':SHA}}}])
  self.assertEqual(api.request.call_count,1);self.assertEqual(monitor.call_args.args[2],'dep-test')
 def test_another_inflight_commit_blocks_post(self):
  with self.assertRaisesRegex(r.ReleaseError,'otro despliegue en curso'):self.invoke([{'deploy':{'id':'dep-other','status':'build_in_progress','commit':{'id':'b'*40}}}])
 def test_new_deploy_pins_exact_commit(self):
  api=Mock();api.service.return_value=SERVICE;api.request.side_effect=[[],{'id':'dep-new'}]
  with patch.object(r,'Render',return_value=api),patch.object(r,'git_commit',return_value=SHA),patch.object(r,'monitor'),patch.object(r.sys,'argv',['render.py','deploy','--commit',SHA]):r.main()
  self.assertEqual(api.request.call_args.args,('/services/srv-test/deploys','POST',{'commitId':SHA}))

class Transport(unittest.TestCase):
 def test_api_uses_only_render_host_and_header_not_query(self):
  with patch.dict(r.os.environ,{'RENDER_API_KEY':'test-placeholder'}):
   api=r.Render()
  response=Mock();response.__enter__=Mock(return_value=response);response.__exit__=Mock(return_value=False);response.read=Mock(return_value=b'{"id":"dep-test"}')
  api.opener=Mock();api.opener.open.return_value=response
  self.assertEqual(api.request('/services/srv-test/deploys','POST',{'commitId':SHA})['id'],'dep-test')
  req=api.opener.open.call_args.args[0]
  self.assertEqual(req.full_url,'https://api.render.com/v1/services/srv-test/deploys')
  self.assertEqual(req.get_header('Authorization'),'Bearer test-placeholder')
  self.assertEqual(r.json.loads(req.data),{'commitId':SHA})
 def test_api_error_does_not_expose_body_or_secret(self):
  with patch.dict(r.os.environ,{'RENDER_API_KEY':'test-placeholder'}):api=r.Render()
  api.opener=Mock();api.opener.open.side_effect=r.urllib.error.HTTPError('https://api.render.com',403,'secret-response',{},None)
  with self.assertRaises(r.ReleaseError) as error:api.request('/services')
  self.assertIn('403',str(error.exception));self.assertNotIn('secret-response',str(error.exception));self.assertNotIn('test-placeholder',str(error.exception))
 def test_redirects_never_forward_auth(self):
  with self.assertRaises(r.ReleaseError):r.NoRedirect().redirect_request(None,None,302,'',{},'https://other.example')

if __name__=='__main__':unittest.main()
