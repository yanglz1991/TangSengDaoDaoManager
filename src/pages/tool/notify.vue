<template>
  <bd-page class="flex-col">
    <div class="flex-1 el-card border-none flex-col box-border overflow-hidden">
      <div class="h-50px pl-12px pr-12px box-border flex items-center justify-between bd-title">
        <div class="bd-title-left">
          <p class="m-0 font-600">下发通知</p>
        </div>
        <div class="flex items-center h-50px">
          <el-form inline>
            <el-form-item class="mb-0 !mr-0">
              <el-button type="primary" :loading="sending" @click="onSend">一键发送给所有人</el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
      <div class="flex-1 overflow-auto p-12px">
        <div class="max-w-600px mx-auto">
          <div
            v-for="(item, index) in messageList"
            :key="item.id"
            class="mb-16px p-16px bd-notify-item"
            style="border: 1px solid var(--el-border-color-lighter); border-radius: 8px"
          >
            <div class="flex items-center justify-between mb-8px">
              <span class="text-14px font-600">
                {{ item.type === 'text' ? '文字消息' : '图片消息' }}
              </span>
              <el-button type="danger" text size="small" @click="onRemoveItem(index)">
                删除
              </el-button>
            </div>
            <!-- 文字 -->
            <template v-if="item.type === 'text'">
              <el-input
                v-model="item.content"
                :autosize="{ minRows: 3, maxRows: 8 }"
                type="textarea"
                placeholder="请输入文字内容"
              />
            </template>
            <!-- 图片 -->
            <template v-else>
              <el-upload
                class="bd-upload"
                :action="item.actionURL"
                list-type="picture-card"
                :show-file-list="false"
                :headers="headers"
                :before-upload="(rawFile: any) => beforeUploadFile(rawFile, item)"
                :on-success="(response: any, _uploadFile: any) => onFileSuccess(response, item)"
              >
                <img
                  v-if="item.url"
                  :src="`${BU_DOU_CONFIG.APP_URL}${item.url}`"
                  style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px"
                />
                <el-icon v-else><Plus /></el-icon>
              </el-upload>
            </template>
          </div>
          <!-- 添加按钮 -->
          <div class="flex gap-12px mt-16px">
            <el-button @click="onAddText">
              <el-icon class="mr-4px"><EditPen /></el-icon>
              添加文字
            </el-button>
            <el-button @click="onAddImage">
              <el-icon class="mr-4px"><Picture /></el-icon>
              添加图片
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </bd-page>
</template>

<route lang="yaml">
meta:
  title: 下发通知
  isAffix: false
</route>

<script lang="ts" setup>
import { ref, reactive } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, EditPen, Picture } from '@element-plus/icons-vue';
import { useUserStore } from '@/stores/modules/user';
import { messageSendAllPost } from '@/api/message';
import { feileGet } from '@/api/file';
import { BU_DOU_CONFIG } from '@/config';

const userStore = useUserStore();

interface MessageItem {
  id: number;
  type: 'text' | 'image';
  content: string;
  url: string;
  actionURL: string;
}

let idCounter = 0;
const messageList = reactive<MessageItem[]>([]);
const sending = ref(false);

const headers = {
  token: userStore.token
};

const onAddText = () => {
  messageList.push({
    id: ++idCounter,
    type: 'text',
    content: '',
    url: '',
    actionURL: ''
  });
};

const onAddImage = () => {
  messageList.push({
    id: ++idCounter,
    type: 'image',
    content: '',
    url: '',
    actionURL: ''
  });
};

const onRemoveItem = (index: number) => {
  messageList.splice(index, 1);
};

const beforeUploadFile = async (rawFile: any, item: MessageItem) => {
  const fileData = {
    path: `/${rawFile.uid}/${rawFile.name}`,
    type: 'report'
  };
  const res = (await feileGet(fileData)) as any;
  if (res.url) {
    item.actionURL = res.url;
    return true;
  }
  return false;
};

const onFileSuccess = (response: any, item: MessageItem) => {
  item.url = response.path;
};

const onSend = () => {
  if (messageList.length === 0) {
    return ElMessage.info('请至少添加一条消息内容');
  }
  for (let i = 0; i < messageList.length; i++) {
    const item = messageList[i];
    if (item.type === 'text' && !item.content.trim()) {
      return ElMessage.info(`第 ${i + 1} 条文字消息内容为空`);
    }
    if (item.type === 'image' && !item.url) {
      return ElMessage.info(`第 ${i + 1} 条图片消息未上传图片`);
    }
  }
  ElMessageBox.confirm(`确定要向所有用户发送 ${messageList.length} 条消息吗？`, '下发通知', {
    confirmButtonText: '确定发送',
    cancelButtonText: '取消',
    closeOnClickModal: false,
    type: 'warning'
  })
    .then(() => {
      const messages = messageList.map(item => {
        if (item.type === 'image') {
          return { type: 2, url: item.url, width: 0, height: 0 };
        }
        return { type: 1, content: item.content };
      });
      sending.value = true;
      messageSendAllPost({ messages })
        .then((res: any) => {
          sending.value = false;
          if (res.status == 200) {
            ElMessage.success('已开始发送，消息将在后台逐条推送给所有用户');
          }
        })
        .catch(err => {
          sending.value = false;
          if (err.status == 400) {
            ElMessage.error(err.msg);
          }
        });
    })
    .catch(() => {});
};
</script>

<style scoped>
.bd-upload :deep(.el-upload--picture-card) {
  width: 120px;
  height: 120px;
}
</style>
