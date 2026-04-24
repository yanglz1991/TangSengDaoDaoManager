build:
	docker build -t tangsengdaodaomanager .
deploy:
	docker build -t tangsengdaodaomanager  .
	docker login --username=hi50071365@aliyun.com crpi-10spfkgd32nbn5ev.cn-shanghai.personal.cr.aliyuncs.com
	docker tag tangsengdaodaomanager crpi-10spfkgd32nbn5ev.cn-shanghai.personal.cr.aliyuncs.com/qxim/manager:latest
	docker push crpi-10spfkgd32nbn5ev.cn-shanghai.personal.cr.aliyuncs.com/qxim/manager:latest