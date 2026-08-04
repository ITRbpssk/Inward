const parameterRepository = require("../repositories/parameter.repository");
const ApiError = require("../utils/ApiError");

class ParameterService {
    async getAllParameters() {
        return await parameterRepository.findAll();
    }

    async getParameterById(parameterId) {
        const param = await parameterRepository.findById(parameterId);
        if (!param) {
            throw new ApiError(404, "Parameter not found");
        }
        return param;
    }

    async createParameter(paramData) {
        const { parameter_name, description, display_order, weightage, status } = paramData;

        if (!parameter_name) {
            throw new ApiError(400, "parameter_name is required");
        }

        // Validate weightage sums are within limit (e.g. total cannot exceed 100)
        const params = await parameterRepository.findAll();
        const activeParams = params.filter(p => p.status === "active");
        const currentTotalWeight = activeParams.reduce((sum, p) => sum + parseFloat(p.weightage), 0);
        
        if (currentTotalWeight + parseFloat(weightage || 0) > 100.01) { // small tolerance for float addition
            throw new ApiError(400, `Total weightage of active parameters cannot exceed 100%. Current sum: ${currentTotalWeight}%`);
        }

        const newId = await parameterRepository.create({
            parameter_name,
            description,
            display_order,
            weightage,
            status
        });
        return await parameterRepository.findById(newId);
    }

    async updateParameter(parameterId, paramData) {
        const { parameter_name, description, display_order, weightage, status } = paramData;

        if (!parameter_name) {
            throw new ApiError(400, "parameter_name is required");
        }

        const param = await parameterRepository.findById(parameterId);
        if (!param) {
            throw new ApiError(404, "Parameter not found");
        }

        // Check new total weightage sum
        if (weightage !== undefined) {
            const params = await parameterRepository.findAll();
            const otherActiveParams = params.filter(p => p.status === "active" && p.parameter_id !== parseInt(parameterId));
            const otherWeightSum = otherActiveParams.reduce((sum, p) => sum + parseFloat(p.weightage), 0);
            
            if (otherWeightSum + parseFloat(weightage) > 100.01) {
                throw new ApiError(400, `Total weightage of active parameters cannot exceed 100%. Current sum without this parameter: ${otherWeightSum}%`);
            }
        }

        await parameterRepository.update(parameterId, {
            parameter_name,
            description,
            display_order,
            weightage,
            status: status || param.status
        });
        return await parameterRepository.findById(parameterId);
    }

    async deleteParameter(parameterId) {
        const param = await parameterRepository.findById(parameterId);
        if (!param) {
            throw new ApiError(404, "Parameter not found");
        }
        return await parameterRepository.delete(parameterId);
    }
}

module.exports = new ParameterService();
